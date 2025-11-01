import { NextPayError, NextPayErrorType } from "./errors";

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * RetryManager handles retry logic with exponential backoff
 */
export class RetryManager {
  constructor(private options: RetryOptions) {}

  /**
   * Executes an operation with retry logic
   * @param operation - Function to execute
   * @param shouldRetry - Function to determine if error should be retried
   * @returns Promise that resolves to operation result
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    shouldRetry: (error: Error) => boolean
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (!shouldRetry(lastError) || attempt === this.options.maxAttempts) {
          throw lastError;
        }

        const delay = this.calculateDelay(attempt);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Calculates delay for retry attempt using exponential backoff
   * @param attempt - Current attempt number (1-based)
   * @returns Delay in milliseconds
   */
  private calculateDelay(attempt: number): number {
    const delay =
      this.options.baseDelay *
      Math.pow(this.options.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.options.maxDelay);
  }

  /**
   * Sleeps for specified milliseconds
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Creates default retry options
 * @param maxAttempts - Maximum number of retry attempts (default: 3)
 * @returns Default retry options
 */
export function createDefaultRetryOptions(maxAttempts: number = 3): RetryOptions {
  return {
    maxAttempts,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
  };
}
