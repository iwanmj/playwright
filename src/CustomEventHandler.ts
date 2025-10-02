import { EventHandler } from "./EventHandler";
import type { Request, Response } from "playwright";

/**
 * Custom event handler with specific business logic
 * Extend this class to implement custom behavior for your stress tests
 */
export class CustomEventHandler extends EventHandler {
  private errorCount = 0;
  private requestCount = 0;
  private serverErrorCount = 0;
  private criticalEndpointFailed = false;

  // Critical endpoints to monitor
  private readonly criticalEndpoints = [
    "/getStore",
    "/getToken",
    "/getOrderTypeData",
    "/getDataAuthStore",
    "/health",
  ];

  // Store all critical endpoint responses
  private criticalEndpointResponses: Map<string, any> = new Map();
  private healthCheckPassed = false;

  /**
   * Track console errors and alert on threshold
   */
  protected override onConsoleError(message: string): void {
    this.errorCount++;

    // Custom logic: Alert if too many console errors
    if (this.errorCount > 10) {
      this.consoleLogger.error(`⚠️ High console error count: ${this.errorCount}`);
    }

    // Custom logic: Track specific errors
    if (message.includes("Failed to load resource")) {
      this.consoleLogger.warn(`Resource loading failed: ${message}`);
    }
  }

  /**
   * Track all network requests
   */
  protected override onRequest(request: Request): void {
    this.requestCount++;

    // Custom logic: Track API calls
    const url = request.url();
    if (url.includes("/api/")) {
      this.networkLogger.info(`API call: ${request.method()} ${url}`);
    }

    // Custom logic: Block certain requests (e.g., analytics)
    if (url.includes("analytics") || url.includes("tracking")) {
      this.networkLogger.info(`Blocking tracking request: ${url}`);
      // Note: You can implement request.abort() if needed
    }
  }

  /**
   * Handle server errors (5xx)
   */
  protected override onServerError(response: Response): void {
    this.serverErrorCount++;
    const url = response.url();
    const status = response.status();

    this.networkLogger.error(`🚨 Server error ${status}: ${url}`);

    // Custom logic: Alert on specific endpoints
    if (url.includes("getbyalias")) {
      this.networkLogger.error(`Critical: Short URL service failed - ${url}`);
    }

    // Custom logic: Alert if too many server errors
    if (this.serverErrorCount > 5) {
      this.networkLogger.error(`⚠️ High server error count: ${this.serverErrorCount}`);
    }
  }

  /**
   * Handle client errors (4xx)
   */
  protected override onClientError(response: Response): void {
    const status = response.status();
    const url = response.url();

    // Custom logic: Track 404s separately
    if (status === 404) {
      this.networkLogger.warn(`Resource not found: ${url}`);
    }

    // Custom logic: Track authentication failures
    if (status === 401 || status === 403) {
      this.networkLogger.error(`Authentication/Authorization failed: ${status} ${url}`);
    }
  }

  /**
   * Handle successful responses - check critical endpoints
   */
  protected override onSuccess(response: Response): void {
    const url = response.url();

    // Check if this is a critical endpoint
    const isCriticalEndpoint = this.criticalEndpoints.some((endpoint) =>
      url.endsWith(endpoint)
    );

    if (isCriticalEndpoint) {
      this.checkCriticalEndpoint(response);
    }
  }

  /**
   * Check critical endpoint response for errors
   */
  private async checkCriticalEndpoint(response: Response): Promise<void> {
    const url = response.url();
    const endpointName = this.criticalEndpoints.find((e) => url.endsWith(e));

    if (!endpointName) return;

    // Special handling for /health endpoint - pass on 200 status regardless of body
    if (endpointName === "/health") {
      if (response.status() === 200) {
        this.healthCheckPassed = true;
        this.criticalEndpointResponses.set(endpointName, {
          url,
          timestamp: new Date().toISOString(),
          status: response.status(),
          body: "OK (200)",
        });
        this.networkLogger.info(`[Critical Endpoint] ${endpointName}: SUCCESS (HTTP 200)`);
      } else {
        // /health returned non-200 status
        this.networkLogger.error(
          `🚨 Critical endpoint ${endpointName} returned status ${response.status()}`
        );
        this.criticalEndpointFailed = true;
        this.criticalEndpointResponses.set(endpointName, {
          url,
          timestamp: new Date().toISOString(),
          status: response.status(),
          error: `HTTP ${response.status()}`,
        });
      }
      return;
    }

    // For other critical endpoints, require valid JSON
    try {
      const responseBody = await response.json();

      // Store the response
      this.criticalEndpointResponses.set(endpointName, {
        url,
        timestamp: new Date().toISOString(),
        status: response.status(),
        body: responseBody,
      });

      // Check if response has error: true
      if (responseBody.error === true) {
        // Log full response only on error
        this.networkLogger.error(
          `🚨 Critical endpoint failed: ${endpointName} returned error:true`
        );
        this.networkLogger.error(`Response: ${JSON.stringify(responseBody)}`);
        this.criticalEndpointFailed = true;
      } else {
        this.networkLogger.info(`[Critical Endpoint] ${endpointName}: SUCCESS`);
      }
    } catch (error) {
      // Not JSON or parsing failed (only for non-health endpoints)
      this.networkLogger.error(
        `🚨 Critical endpoint ${endpointName} did not return valid JSON: ${error}`
      );
      this.criticalEndpointFailed = true;

      // Store error state
      this.criticalEndpointResponses.set(endpointName, {
        url,
        timestamp: new Date().toISOString(),
        status: response.status(),
        error: `Failed to parse JSON response: ${error}`,
      });
    }
  }

  /**
   * Check if any critical endpoint failed
   */
  hasCriticalFailure(): boolean {
    return this.criticalEndpointFailed;
  }

  /**
   * Check if health check passed
   */
  hasHealthCheckPassed(): boolean {
    return this.healthCheckPassed;
  }

  /**
   * Get all stored critical endpoint responses
   */
  getCriticalEndpointResponses(): Map<string, any> {
    return this.criticalEndpointResponses;
  }

  /**
   * Get a specific endpoint response
   */
  getEndpointResponse(endpointName: string): any {
    return this.criticalEndpointResponses.get(endpointName);
  }

  /**
   * Get all responses as a plain object
   */
  getAllResponsesAsObject(): Record<string, any> {
    const obj: Record<string, any> = {};
    this.criticalEndpointResponses.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  /**
   * Get stress test statistics
   */
  getStats() {
    return {
      totalRequests: this.requestCount,
      consoleErrors: this.errorCount,
      serverErrors: this.serverErrorCount,
      criticalEndpointsTracked: this.criticalEndpointResponses.size,
      criticalEndpointsFailed: this.criticalEndpointFailed,
    };
  }
}
