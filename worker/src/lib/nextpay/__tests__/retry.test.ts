import { describe, it, expect, beforeEach, vi } from "vitest";
import { RetryManager, createDefaultRetryOptions } from "../retry";
import { NextPayError, NextPayErrorType } from "../errors";

describe("Retry Manager", () => {
  let retryManager: RetryManager;

  beforeEach(() => {
    retryManager = new RetryManager(createDefaultRetryOptions(3));
  });

  it("should execute operation successfully on first attempt", async () => {
    const operation = vi.fn().mockResolvedValue("success");
    const shouldRetry = vi.fn().mockReturnValue(true);

    const result = await retryManager.executeWithRetry(operation, shouldRetry);

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(1);
    expect(shouldRetry).not.toHaveBeenCalled();
  });

  it("should retry on failure and eventually succeed", async () => {
    let callCount = 0;
    const operation = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        throw new NextPayError(NextPayErrorType.NETWORK_ERROR, "Network error");
      }
      return "success";
    });
    const shouldRetry = vi.fn().mockReturnValue(true);

    const result = await retryManager.executeWithRetry(operation, shouldRetry);

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(3);
    expect(shouldRetry).toHaveBeenCalledTimes(2);
  });

  it("should not retry if shouldRetry returns false", async () => {
    const operation = vi.fn().mockRejectedValue(
      new NextPayError(NextPayErrorType.AUTHENTICATION_ERROR, "Auth error")
    );
    const shouldRetry = vi.fn().mockReturnValue(false);

    await expect(retryManager.executeWithRetry(operation, shouldRetry))
      .rejects.toThrow("Auth error");

    expect(operation).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledTimes(1);
  });

  it("should exhaust retries and throw last error", async () => {
    const operation = vi.fn().mockRejectedValue(
      new NextPayError(NextPayErrorType.NETWORK_ERROR, "Network error")
    );
    const shouldRetry = vi.fn().mockReturnValue(true);

    await expect(retryManager.executeWithRetry(operation, shouldRetry))
      .rejects.toThrow("Network error");

    expect(operation).toHaveBeenCalledTimes(3);
    expect(shouldRetry).toHaveBeenCalledTimes(3);
  });

  it("should calculate delay correctly with exponential backoff", () => {
    const options = {
      maxAttempts: 5,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
    };
    const manager = new RetryManager(options);

    // Access private method for testing
    const calculateDelay = (manager as any).calculateDelay.bind(manager);

    expect(calculateDelay(1)).toBe(1000); // 1000 * 2^0
    expect(calculateDelay(2)).toBe(2000); // 1000 * 2^1
    expect(calculateDelay(3)).toBe(4000); // 1000 * 2^2
    expect(calculateDelay(4)).toBe(8000); // 1000 * 2^3
    expect(calculateDelay(5)).toBe(10000); // Capped at maxDelay
  });

  it("should create default retry options", () => {
    const options = createDefaultRetryOptions(5);

    expect(options.maxAttempts).toBe(5);
    expect(options.baseDelay).toBe(1000);
    expect(options.maxDelay).toBe(10000);
    expect(options.backoffMultiplier).toBe(2);
  });

  it("should use default maxAttempts when not specified", () => {
    const options = createDefaultRetryOptions();

    expect(options.maxAttempts).toBe(3);
  });
});
