/**
 * NextPay Error Types and Handling
 */

export enum NextPayErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export class NextPayError extends Error {
  constructor(
    public type: NextPayErrorType,
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "NextPayError";
  }
}

/**
 * Creates a NextPayError from an HTTP response
 * @param response - HTTP response object
 * @param body - Response body (optional)
 * @returns NextPayError instance
 */
export function createNextPayError(
  response: Response,
  body?: any
): NextPayError {
  const statusCode = response.status;
  
  // Try to extract error message from response body
  let errorMessage = "Unknown error occurred";
  let errorDetails = body;
  
  if (body && typeof body === 'object') {
    if (body.message) {
      errorMessage = body.message;
    } else if (body.error) {
      errorMessage = typeof body.error === 'string' ? body.error : body.error.message || String(body.error);
    } else if (body.details) {
      errorMessage = typeof body.details === 'string' ? body.details : JSON.stringify(body.details);
    }
  } else if (typeof body === 'string') {
    errorMessage = body;
  }

  switch (statusCode) {
    case 401:
      return new NextPayError(
        NextPayErrorType.AUTHENTICATION_ERROR,
        "Authentication failed - " + errorMessage,
        statusCode,
        errorDetails
      );
    case 429:
      return new NextPayError(
        NextPayErrorType.RATE_LIMIT_ERROR,
        "Rate limit exceeded - " + errorMessage,
        statusCode,
        errorDetails
      );
    case 400:
    case 422:
      return new NextPayError(
        NextPayErrorType.VALIDATION_ERROR,
        "Request validation failed - " + errorMessage,
        statusCode,
        errorDetails
      );
    case 500:
    case 502:
    case 503:
    case 504:
      return new NextPayError(
        NextPayErrorType.SERVER_ERROR,
        "Server error occurred - " + errorMessage,
        statusCode,
        errorDetails
      );
    default:
      return new NextPayError(
        NextPayErrorType.UNKNOWN_ERROR,
        errorMessage,
        statusCode,
        errorDetails
      );
  }
}

/**
 * Determines if an error should be retried
 * @param error - Error to check
 * @returns true if the error should be retried
 */
export function shouldRetry(error: Error): boolean {
  if (error instanceof NextPayError) {
    switch (error.type) {
      case NextPayErrorType.NETWORK_ERROR:
      case NextPayErrorType.TIMEOUT_ERROR:
      case NextPayErrorType.RATE_LIMIT_ERROR:
      case NextPayErrorType.SERVER_ERROR:
        return true;
      case NextPayErrorType.AUTHENTICATION_ERROR:
      case NextPayErrorType.VALIDATION_ERROR:
        return false;
      default:
        return false;
    }
  }
  return false;
}
