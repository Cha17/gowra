import { describe, it, expect, beforeEach, vi } from "vitest";
import { 
  NextPayError, 
  NextPayErrorType, 
  createNextPayError, 
  shouldRetry 
} from "../errors";

describe("NextPay Errors", () => {
  it("should create NextPayError with correct properties", () => {
    const error = new NextPayError(
      NextPayErrorType.AUTHENTICATION_ERROR,
      "Test error",
      401,
      { details: "test" }
    );

    expect(error.type).toBe(NextPayErrorType.AUTHENTICATION_ERROR);
    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(401);
    expect(error.details).toEqual({ details: "test" });
    expect(error.name).toBe("NextPayError");
  });

  it("should create error from HTTP response", () => {
    const mockResponse = {
      status: 401,
    } as Response;

    const error = createNextPayError(mockResponse, { error: "Unauthorized" });
    
    expect(error.type).toBe(NextPayErrorType.AUTHENTICATION_ERROR);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("Authentication failed");
  });

  it("should classify different HTTP status codes correctly", () => {
    const testCases = [
      { status: 400, expectedType: NextPayErrorType.VALIDATION_ERROR },
      { status: 401, expectedType: NextPayErrorType.AUTHENTICATION_ERROR },
      { status: 422, expectedType: NextPayErrorType.VALIDATION_ERROR },
      { status: 429, expectedType: NextPayErrorType.RATE_LIMIT_ERROR },
      { status: 500, expectedType: NextPayErrorType.SERVER_ERROR },
      { status: 502, expectedType: NextPayErrorType.SERVER_ERROR },
      { status: 503, expectedType: NextPayErrorType.SERVER_ERROR },
      { status: 504, expectedType: NextPayErrorType.SERVER_ERROR },
      { status: 999, expectedType: NextPayErrorType.UNKNOWN_ERROR },
    ];

    testCases.forEach(({ status, expectedType }) => {
      const mockResponse = { status } as Response;
      const error = createNextPayError(mockResponse);
      expect(error.type).toBe(expectedType);
      expect(error.statusCode).toBe(status);
    });
  });

  it("should determine retry eligibility correctly", () => {
    const retryableErrors = [
      new NextPayError(NextPayErrorType.NETWORK_ERROR, "Network error"),
      new NextPayError(NextPayErrorType.TIMEOUT_ERROR, "Timeout error"),
      new NextPayError(NextPayErrorType.RATE_LIMIT_ERROR, "Rate limit error"),
      new NextPayError(NextPayErrorType.SERVER_ERROR, "Server error"),
    ];

    const nonRetryableErrors = [
      new NextPayError(NextPayErrorType.AUTHENTICATION_ERROR, "Auth error"),
      new NextPayError(NextPayErrorType.VALIDATION_ERROR, "Validation error"),
    ];

    retryableErrors.forEach(error => {
      expect(shouldRetry(error)).toBe(true);
    });

    nonRetryableErrors.forEach(error => {
      expect(shouldRetry(error)).toBe(false);
    });

    // Test non-NextPayError
    expect(shouldRetry(new Error("Generic error"))).toBe(false);
  });
});
