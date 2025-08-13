import { Context } from 'hono';

// ===== PHASE 3, STEP 3.1: ERROR HANDLING MIDDLEWARE =====

// Custom error classes for better error handling
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code: string;

  constructor(message: string, statusCode: number, code: string = 'UNKNOWN_ERROR', isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
    
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message, 400, code);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', code: string = 'AUTHENTICATION_ERROR') {
    super(message, 401, code);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', code: string = 'AUTHORIZATION_ERROR') {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: string = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', code: string = 'RATE_LIMIT_EXCEEDED') {
    super(message, 429, code);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', code: string = 'DATABASE_ERROR') {
    super(message, 500, code);
  }
}

// Error response interface
export interface ErrorResponse {
  error: string;
  message: string;
  code: string;
  timestamp: string;
  requestId?: string;
  errorId?: string;
  details?: string;
  stack?: string;
  path?: string;
  method?: string;
}

// Error handler function
export const handleError = (error: Error, c: Context): Response => {
  const timestamp = new Date().toISOString();
  const requestId = c.get('requestId') || 'unknown';
  const errorId = Math.random().toString(36).substring(2, 15);
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log error details
  console.error(`[${timestamp}] Error ID: ${errorId} - Request ID: ${requestId}`);
  console.error('Error Details:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    request: {
      method: c.req.method,
      path: c.req.path,
      headers: c.req.header()
    }
  });

  // Handle custom app errors
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: error.name,
      message: error.message,
      code: error.code,
      timestamp,
      requestId,
      errorId,
      path: c.req.path,
      method: c.req.method
    };

    // Add development details
    if (isDevelopment) {
      response.details = error.message;
      response.stack = error.stack;
    }

    return c.json(response, error.statusCode as any);
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    const response: ErrorResponse = {
      error: 'Validation Error',
      message: error.message,
      code: 'VALIDATION_ERROR',
      timestamp,
      requestId,
      errorId,
      path: c.req.path,
      method: c.req.method
    };

    if (isDevelopment) {
      response.details = error.message;
      response.stack = error.stack;
    }

    return c.json(response, 400);
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    const response: ErrorResponse = {
      error: 'Invalid Token',
      message: 'The provided token is invalid or expired',
      code: 'INVALID_TOKEN',
      timestamp,
      requestId,
      errorId,
      path: c.req.path,
      method: c.req.method
    };

    if (isDevelopment) {
      response.details = error.message;
      response.stack = error.stack;
    }

    return c.json(response, 401);
  }

  // Handle database errors
  if (error.name === 'DatabaseError' || error.message.includes('database')) {
    const response: ErrorResponse = {
      error: 'Database Error',
      message: 'A database operation failed',
      code: 'DATABASE_ERROR',
      timestamp,
      requestId,
      errorId,
      path: c.req.path,
      method: c.req.method
    };

    if (isDevelopment) {
      response.details = error.message;
      response.stack = error.stack;
    }

    return c.json(response, 500);
  }

  // Handle unknown errors
  const response: ErrorResponse = {
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong on our end',
    code: 'INTERNAL_ERROR',
    timestamp,
    requestId,
    errorId,
    path: c.req.path,
    method: c.req.method
  };

  if (isDevelopment) {
    response.details = error.message;
    response.stack = error.stack;
  }

  return c.json(response, 500);
};

// Async error wrapper for route handlers
export const asyncHandler = <T extends Context>(handler: (c: T) => Promise<Response>) => {
  return async (c: T): Promise<Response> => {
    try {
      return await handler(c);
    } catch (error) {
      return handleError(error as Error, c);
    }
  };
};

// Validation error helper
export const createValidationError = (field: string, message: string): ValidationError => {
  return new ValidationError(`${field}: ${message}`, 'VALIDATION_ERROR');
};

// Database error helper
export const createDatabaseError = (operation: string, error: Error): DatabaseError => {
  return new DatabaseError(`Database ${operation} failed: ${error.message}`, 'DATABASE_ERROR');
};

// Rate limit error helper
export const createRateLimitError = (retryAfter?: number): RateLimitError => {
  const error = new RateLimitError();
  if (retryAfter) {
    error.message = `Rate limit exceeded. Please try again in ${retryAfter} seconds.`;
  }
  return error;
};

// Export all error utilities
export const errorUtils = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  handleError,
  asyncHandler,
  createValidationError,
  createDatabaseError,
  createRateLimitError
};
