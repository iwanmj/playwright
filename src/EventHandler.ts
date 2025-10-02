import type { Logger } from "winston";
import type { ConsoleMessage, Request, Response } from "playwright";

/**
 * Event handler for browser console and network events
 * Provides hooks for custom behavior based on events
 */
export class EventHandler {
  constructor(
    protected consoleLogger: Logger,
    protected networkLogger: Logger
  ) {}

  /**
   * Handle browser console messages
   * @param msg - Console message from the browser
   */
  handleConsole(msg: ConsoleMessage): void {
    const type = msg.type();
    const text = msg.text();

    // Log to console logger
    this.consoleLogger.info(`[Browser ${type.toUpperCase()}] ${text}`);

    // Custom actions based on console type
    if (type === "error") {
      this.onConsoleError(text);
    } else if (type === "warning") {
      this.onConsoleWarning(text);
    } else if (type === "log") {
      this.onConsoleLog(text);
    }
  }

  /**
   * Handle network requests
   * @param request - Network request from the browser
   */
  handleRequest(request: Request): void {
    const method = request.method();
    const url = request.url();
    const resourceType = request.resourceType();

    // Only log XHR and fetch requests to network logger
    if (resourceType === "xhr" || resourceType === "fetch") {
      this.networkLogger.info(`[Network] → ${method} ${url}`);
    }

    // Custom actions based on request
    this.onRequest(request);
  }

  /**
   * Handle network responses
   * @param response - Network response from the browser
   */
  handleResponse(response: Response): void {
    const status = response.status();
    const url = response.url();
    const request = response.request();
    const resourceType = request.resourceType();

    // Only log XHR and fetch responses to network logger
    if (resourceType === "xhr" || resourceType === "fetch") {
      this.networkLogger.info(`[Network] ← ${status} ${url}`);
    }

    // Custom actions based on response status
    if (status >= 500) {
      this.onServerError(response);
    } else if (status >= 400) {
      this.onClientError(response);
    } else if (status >= 200 && status < 300) {
      this.onSuccess(response);
    }
  }

  // === Hooks for custom behavior ===

  /**
   * Hook: Called when browser console.error() occurs
   */
  protected onConsoleError(message: string): void {
    // Override this method for custom error handling
    // Example: Track error counts, alert on specific errors, etc.
  }

  /**
   * Hook: Called when browser console.warn() occurs
   */
  protected onConsoleWarning(message: string): void {
    // Override this method for custom warning handling
  }

  /**
   * Hook: Called when browser console.log() occurs
   */
  protected onConsoleLog(message: string): void {
    // Override this method for custom log handling
  }

  /**
   * Hook: Called on every network request
   */
  protected onRequest(request: Request): void {
    // Override this method for custom request handling
    // Example: Block certain requests, modify headers, etc.
  }

  /**
   * Hook: Called when response status is 2xx
   */
  protected onSuccess(response: Response): void {
    // Override this method for custom success handling
  }

  /**
   * Hook: Called when response status is 4xx
   */
  protected onClientError(response: Response): void {
    // Override this method for custom client error handling
    this.networkLogger.warn(`Client error: ${response.status()} ${response.url()}`);
  }

  /**
   * Hook: Called when response status is 5xx
   */
  protected onServerError(response: Response): void {
    // Override this method for custom server error handling
    this.networkLogger.error(`Server error: ${response.status()} ${response.url()}`);
  }
}
