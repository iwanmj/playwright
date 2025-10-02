import { type Browser, type Page, type BrowserContext } from "playwright";
import { createRunnerLogger } from "./logger";
import { CustomEventHandler } from "./CustomEventHandler";
import { Scenario } from "./Scenario";
import type { Logger } from "winston";
import path from "path";

/**
 * Runner class for headless browser stress testing
 * Handles browser automation and performance testing for a specific URL
 */
export class Runner {
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private consoleLogger: Logger;
  private networkLogger: Logger;
  private eventHandler: CustomEventHandler;

  /**
   * Creates a new Runner instance
   * @param url - The URL to test
   * @param browser - Shared browser instance
   * @param id - Runner identifier for logging
   */
  constructor(
    private url: string,
    private browser: Browser,
    private id: number = 0
  ) {
    const loggers = createRunnerLogger(id);
    this.consoleLogger = loggers.consoleLogger;
    this.networkLogger = loggers.networkLogger;
    this.eventHandler = new CustomEventHandler(this.consoleLogger, this.networkLogger);
  }

  /**
   * Execute the test run
   */
  async run(): Promise<void> {
    try {
      // Create isolated browser context (like incognito mode)
      this.context = await this.browser.newContext();
      this.page = await this.context.newPage();

      // Intercept browser console events
      this.page.on("console", (msg) => {
        this.eventHandler.handleConsole(msg);
      });

      // Intercept network requests
      this.page.on("request", (request) => {
        this.eventHandler.handleRequest(request);
      });

      // Intercept network responses
      this.page.on("response", (response) => {
        this.eventHandler.handleResponse(response);
      });

      // Navigate to URL
      this.consoleLogger.info(`Opening: ${this.url}`);
      await this.page.goto(this.url, { waitUntil: "networkidle" });
      this.consoleLogger.info(`Loaded: ${this.url}`);

      // Wait for and monitor iframe
      await this.monitorIframe();

      // Wait for app to be ready (health check)
      await this.waitForAppReady();

      // Check if any critical endpoint failed
      if (this.eventHandler.hasCriticalFailure()) {
        this.consoleLogger.error(
          "Critical endpoint failure detected - stopping runner and taking screenshot"
        );
        await this.captureScreenshot();
        return;
      }

      // Take screenshot before starting scenario
      await this.captureScreenshot("before-scenario");

      // Execute automated scenario
      await this.executeScenario();

      // Take screenshot of final state
      await this.captureScreenshot("after-scenario");

      // Log summary of collected responses
      this.logResponseSummary();
    } catch (error) {
      this.consoleLogger.error(`Error: ${error}`);
    } finally {
      // Cleanup context (browser is shared, don't close it)
      if (this.context) {
        await this.context.close();
      }
    }
  }

  /**
   * Get the event handler (to access collected data)
   */
  getEventHandler(): CustomEventHandler {
    return this.eventHandler;
  }

  /**
   * Get all critical endpoint responses
   */
  getCriticalEndpointResponses(): Record<string, any> {
    return this.eventHandler.getAllResponsesAsObject();
  }

  /**
   * Log summary of collected responses
   */
  private logResponseSummary(): void {
    const responses = this.eventHandler.getAllResponsesAsObject();
    const stats = this.eventHandler.getStats();

    this.consoleLogger.info("=== Runner Summary ===");
    this.consoleLogger.info(`Total Requests: ${stats.totalRequests}`);
    this.consoleLogger.info(`Console Errors: ${stats.consoleErrors}`);
    this.consoleLogger.info(`Server Errors: ${stats.serverErrors}`);
    this.consoleLogger.info(
      `Critical Endpoints Tracked: ${stats.criticalEndpointsTracked}`
    );

    Object.entries(responses).forEach(([endpoint, data]) => {
      this.consoleLogger.info(`${endpoint}: ${data.error ? "FAILED" : "SUCCESS"}`);
    });
  }

  /**
   * Wait for iframe and attach monitoring
   */
  private async monitorIframe(): Promise<void> {
    if (!this.page) return;

    try {
      this.consoleLogger.info("Waiting for iframe#iframeFE...");

      // Wait for specific iframe to appear in the DOM
      await this.page.waitForSelector("iframe#iframeFE", { timeout: 10000 });
      this.consoleLogger.info("iframe#iframeFE found");

      // Get the iframe element handle
      const iframeElement = await this.page.$("iframe#iframeFE");
      if (!iframeElement) {
        this.consoleLogger.error("iframe#iframeFE not found after wait");
        return;
      }

      // Get the frame from the iframe element
      const iframeContent = await iframeElement.contentFrame();
      if (!iframeContent) {
        this.consoleLogger.error("Could not access iframe#iframeFE content");
        return;
      }

      const iframeUrl = iframeContent.url();
      this.consoleLogger.info(`iframe#iframeFE URL: ${iframeUrl}`);

      // Wait for iframe to be fully loaded
      await iframeContent.waitForLoadState("networkidle").catch(() => {
        this.consoleLogger.warn("iframe#iframeFE did not reach networkidle state");
      });

      this.consoleLogger.info("iframe#iframeFE loaded and monitored");
    } catch (error) {
      this.consoleLogger.error(`Iframe monitoring failed: ${error}`);
    }
  }

  /**
   * Wait for app to be ready by monitoring /health endpoint
   */
  private async waitForAppReady(): Promise<void> {
    if (!this.page) return;

    try {
      this.consoleLogger.info("Waiting for /health endpoint...");

      // Wait for /health endpoint to be called
      // The response is already being tracked by CustomEventHandler
      await this.page.waitForResponse(
        (response) => {
          const url = response.url();
          return url.endsWith("/health");
        },
        { timeout: 30000 } // 30 second timeout
      );

      // Check if health check passed (already parsed by event handler)
      // Give it a moment to process the response
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (this.eventHandler.hasHealthCheckPassed()) {
        this.consoleLogger.info("App is ready: Health check passed");
      } else {
        this.consoleLogger.warn("Health endpoint called but did not return OK status");
      }
    } catch (error) {
      this.consoleLogger.error(`Health check timeout: ${error}`);
    }
  }

  /**
   * Execute the automated scenario
   */
  private async executeScenario(): Promise<void> {
    if (!this.page) return;

    try {
      const scenario = new Scenario(
        this.page,
        this.consoleLogger,
        this.networkLogger,
        this.id
      );
      await scenario.execute();
    } catch (error) {
      this.consoleLogger.error(`Scenario execution error: ${error}`);
      throw error;
    }
  }

  /**
   * Capture screenshot of the iframe only
   */
  private async captureScreenshot(label?: string): Promise<void> {
    if (!this.page) return;

    try {
      const screenshotsDir = path.join(process.cwd(), "screenshots");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const labelPart = label ? `-${label}` : "";
      const filename = `runner-${this.id}${labelPart}-${timestamp}.png`;
      const filepath = path.join(screenshotsDir, filename);

      // Get the iframe element
      const iframeElement = await this.page.$("iframe#iframeFE");
      if (!iframeElement) {
        this.consoleLogger.error("iframe#iframeFE not found for screenshot");
        return;
      }

      // Take screenshot of only the iframe element
      await iframeElement.screenshot({
        path: filepath,
      });

      this.consoleLogger.info(`Screenshot saved: ${filename}`);
    } catch (error) {
      this.consoleLogger.error(`Screenshot failed: ${error}`);
    }
  }
}
