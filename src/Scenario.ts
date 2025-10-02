import type { Page, Frame } from "playwright";
import type { Logger } from "winston";
import path from "path";

/**
 * Scenario class for automated user interactions
 * Executes after the page is fully loaded and health check passes
 */
export class Scenario {
  /**
   * Creates a new Scenario instance
   * @param page - Playwright page instance
   * @param consoleLogger - Logger for general logs
   * @param networkLogger - Logger for network logs
   * @param runnerId - Runner identifier for screenshot naming
   */
  constructor(
    private page: Page,
    private consoleLogger: Logger,
    private networkLogger: Logger,
    private runnerId: number
  ) {}

  /**
   * Get the iframe content frame
   * All components are inside iframe#iframeFE
   */
  private async getIframeContent(): Promise<Frame> {
    const iframeElement = await this.page.$("iframe#iframeFE");
    if (!iframeElement) {
      throw new Error("iframe#iframeFE not found");
    }

    const iframeContent = await iframeElement.contentFrame();
    if (!iframeContent) {
      throw new Error("Could not access iframe#iframeFE content");
    }

    return iframeContent;
  }

  /**
   * Execute the automated scenario
   */
  async execute(): Promise<void> {
    this.consoleLogger.info("Starting scenario execution...");

    try {
      // Scenario steps will go here
      await this.step1();
      await this.takeScreenshot("step1");

      await this.step2();
      await this.takeScreenshot("step2");

      await this.step3();
      await this.takeScreenshot("step3");

      await this.step4();
      await this.takeScreenshot("step4");

      // Add more steps as needed

      this.consoleLogger.info("Scenario execution completed successfully");
    } catch (error) {
      this.consoleLogger.error(`Scenario execution failed: ${error}`);
      throw error;
    }
  }

  /**
   * Take screenshot of the iframe
   */
  private async takeScreenshot(stepName: string): Promise<void> {
    try {
      const screenshotsDir = path.join(process.cwd(), "screenshots");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `runner-${this.runnerId}-${stepName}-${timestamp}.png`;
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
      this.consoleLogger.error(`Screenshot failed for ${stepName}: ${error}`);
    }
  }

  /**
   * Step 1: Click button with specific xpath
   */
  private async step1(): Promise<void> {
    this.consoleLogger.info("Step 1: Looking for button inside iframe...");

    try {
      // Get the iframe content (all components are inside iframe)
      const iframe = await this.getIframeContent();

      const buttonXpath = '//*[@id="root"]/div/div/div[1]/div[1]/div[1]/div/div[4]/button';

      // Wait for button to be visible inside iframe
      await iframe.waitForSelector(`xpath=${buttonXpath}`, {
        timeout: 10000,
        state: 'visible'
      });

      this.consoleLogger.info("Step 1: Button found, clicking...");

      // Click the button inside iframe
      await iframe.click(`xpath=${buttonXpath}`);

      this.consoleLogger.info("Step 1: Button clicked successfully");

      // Wait a bit for any actions triggered by the click
      await this.page.waitForTimeout(1000);
    } catch (error) {
      this.consoleLogger.error(`Step 1 failed: ${error}`);
      throw error;
    }
  }

  /**
   * Step 2: Click button with specific xpath
   */
  private async step2(): Promise<void> {
    this.consoleLogger.info("Step 2: Looking for button inside iframe...");

    try {
      // Get the iframe content (all components are inside iframe)
      const iframe = await this.getIframeContent();

      const buttonXpath = '//*[@id="root"]/div/div/div[1]/div[1]/div[3]/div/div[2]/div/div/div/div/button';

      // Wait for button to be visible inside iframe
      await iframe.waitForSelector(`xpath=${buttonXpath}`, {
        timeout: 10000,
        state: 'visible'
      });

      this.consoleLogger.info("Step 2: Button found, clicking...");

      // Click the button inside iframe
      await iframe.click(`xpath=${buttonXpath}`);

      this.consoleLogger.info("Step 2: Button clicked successfully");

      // Wait a few moments for any actions triggered by the click
      await this.page.waitForTimeout(2000);
    } catch (error) {
      this.consoleLogger.error(`Step 2 failed: ${error}`);
      throw error;
    }
  }

  /**
   * Step 3: Select radio input with specific xpath
   */
  private async step3(): Promise<void> {
    this.consoleLogger.info("Step 3: Looking for radio input inside iframe...");

    try {
      // Get the iframe content (all components are inside iframe)
      const iframe = await this.getIframeContent();

      const radioXpath = '//*[@id="input"]/span/input';

      // Wait for radio input to be visible inside iframe
      await iframe.waitForSelector(`xpath=${radioXpath}`, {
        timeout: 10000,
        state: 'visible'
      });

      this.consoleLogger.info("Step 3: Radio input found, selecting...");

      // Click the radio input to select it
      await iframe.click(`xpath=${radioXpath}`);

      this.consoleLogger.info("Step 3: Radio input selected successfully");

      // Wait a moment for any actions triggered by the selection
      await this.page.waitForTimeout(1000);
    } catch (error) {
      this.consoleLogger.error(`Step 3 failed: ${error}`);
      throw error;
    }
  }

  /**
   * Step 4: Click add to cart button
   */
  private async step4(): Promise<void> {
    this.consoleLogger.info("Step 4: Looking for add to cart button inside iframe...");

    try {
      // Get the iframe content (all components are inside iframe)
      const iframe = await this.getIframeContent();

      const buttonXpath = '//*[@id="addToCartModal"]/button';

      // Wait for button to be visible inside iframe
      await iframe.waitForSelector(`xpath=${buttonXpath}`, {
        timeout: 10000,
        state: 'visible'
      });

      this.consoleLogger.info("Step 4: Add to cart button found, clicking...");

      // Click the button
      await iframe.click(`xpath=${buttonXpath}`);

      this.consoleLogger.info("Step 4: Add to cart button clicked successfully");

      // Wait a moment for any actions triggered by the click
      await this.page.waitForTimeout(1000);
    } catch (error) {
      this.consoleLogger.error(`Step 4 failed: ${error}`);
      throw error;
    }
  }
}
