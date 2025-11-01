import type { NextPayConfig, NextPayHttpClient, RequestOptions } from "./types";
import { NextPayAuthenticator } from "./auth";
import { NextPayError, NextPayErrorType, createNextPayError, shouldRetry } from "./errors";
import { RetryManager, createDefaultRetryOptions } from "./retry";

/**
 * Logger interface for HTTP client
 */
export interface Logger {
  info(message: string, context?: Record<string, any>): void;
  error(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  debug(message: string, context?: Record<string, any>): void;
}

/**
 * NextPay HTTP Client Implementation
 */
export class NextPayHttpClientImpl implements NextPayHttpClient {
  private authenticator: NextPayAuthenticator;
  private retryManager: RetryManager;

  constructor(private config: NextPayConfig, private logger: Logger) {
    this.authenticator = new NextPayAuthenticator({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });
    
    this.retryManager = new RetryManager(
      createDefaultRetryOptions(config.retryAttempts)
    );
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.makeRequest<T>("GET", endpoint, undefined, options);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.makeRequest<T>("POST", endpoint, data, options);
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.makeRequest<T>("PUT", endpoint, data, options);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.makeRequest<T>("DELETE", endpoint, undefined, options);
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = this.buildHeaders(options?.headers);

    const requestOptions: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(options?.timeout || this.config.timeout),
    };

    this.logger.debug(`Making ${method} request to ${endpoint}`, {
      url,
      hasBody: !!data,
      timeout: requestOptions.signal,
    });

    return this.retryManager.executeWithRetry(
      () => this.executeRequest<T>(url, requestOptions),
      shouldRetry
    );
  }

  private async executeRequest<T>(url: string, options: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        let body: any;
        try {
          body = await response.json();
        } catch {
          body = await response.text();
        }
        
        // Log the actual error details
        this.logger.error(`Request failed`, {
          status: response.status,
          statusText: response.statusText,
          url,
        });
        
        const error = createNextPayError(response, body);
        // Log more details about the error
        this.logger.error(`NextPayError created: ${error.type} - ${error.message}`, {
          statusCode: error.statusCode,
          details: error.details,
        });
        
        throw error;
      }

      const data = await response.json() as T;
      this.logger.debug(`Request successful`, { url, status: response.status });
      return data;
    } catch (error) {
      if (error instanceof NextPayError) {
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new NextPayError(
          NextPayErrorType.NETWORK_ERROR,
          "Network error occurred",
          undefined,
          error.message
        );
        this.logger.error("Network error", { url, error: error.message });
        throw networkError;
      }
      
      // Handle timeout errors
      if (error instanceof Error && error.name === 'TimeoutError') {
        const timeoutError = new NextPayError(
          NextPayErrorType.TIMEOUT_ERROR,
          "Request timeout",
          undefined,
          error.message
        );
        this.logger.error("Request timeout", { url, error: error.message });
        throw timeoutError;
      }
      
      // Re-throw unknown errors
      this.logger.error("Unknown error", { url, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  private buildHeaders(
    customHeaders?: Record<string, string>
  ): Record<string, string> {
    const authHeader = this.authenticator.generateAuthHeader();
    return {
      "Content-Type": "application/json",
      Authorization: authHeader,
      ...customHeaders,
    };
  }
}
