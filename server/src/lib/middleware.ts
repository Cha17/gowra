import { Context, Next } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { timing } from 'hono/timing';
import { secureHeaders } from 'hono/secure-headers';

// ===== PHASE 3, STEP 3.1: MIDDLEWARE CONFIGURATION =====

// Define custom context variables
interface CustomContext {
  Variables: {
    requestId: string;
    apiVersion: string;
  };
}

// Enhanced logging middleware for debugging
export const enhancedLogger = logger();

// Security headers configuration
export const securityHeaders = secureHeaders({
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  crossOriginEmbedderPolicy: 'require-corp',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin',
  strictTransportSecurity: 'max-age=31536000; includeSubDomains'
});

// CORS configuration
export const corsConfig = cors({
  origin: [
    'http://localhost:3000',  // React dev server
    'http://localhost:8080',  // Hono server
    'http://localhost:3001',  // Alternative React port
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])  // Environment variable for client URL
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key'
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  exposeHeaders: ['X-Total-Count', 'X-Page-Count', 'X-API-Version']
});

// Request validation middleware
export const requestValidator = async (c: Context<CustomContext>, next: Next) => {
  try {
    // Validate Content-Type for non-GET requests
    if (c.req.method !== 'GET' && c.req.method !== 'OPTIONS') {
      const contentType = c.req.header('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        return c.json({ 
          error: 'Invalid Content-Type', 
          message: 'Content-Type must be application/json',
          code: 'INVALID_CONTENT_TYPE'
        }, 400);
      }
    }
    
    // Validate request size (optional)
    const contentLength = c.req.header('Content-Length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
      return c.json({
        error: 'Request Too Large',
        message: 'Request body exceeds 10MB limit',
        code: 'REQUEST_TOO_LARGE'
      }, 413);
    }
    
    await next();
  } catch (error) {
    console.error('Request validation error:', error);
    return c.json({
      error: 'Request Validation Failed',
      message: 'Failed to validate request',
      code: 'VALIDATION_ERROR'
    }, 400);
  }
};

// Rate limiting middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number; blocked: boolean }>();

export const rateLimiter = async (c: Context<CustomContext>, next: Next) => {
  try {
    const clientIP = c.req.header('X-Forwarded-For') || 
                     c.req.header('X-Real-IP') || 
                     'unknown';
    
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100; // Max requests per window
    const blockDuration = 60 * 1000; // 1 minute block duration
    
    const clientData = rateLimitMap.get(clientIP);
    
    // Check if client is blocked
    if (clientData?.blocked && now < clientData.resetTime) {
      return c.json({ 
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      }, 429);
    }
    
    if (clientData && now < clientData.resetTime) {
      if (clientData.count >= maxRequests) {
        // Block the client
        rateLimitMap.set(clientIP, {
          count: clientData.count,
          resetTime: now + blockDuration,
          blocked: true
        });
        
        return c.json({ 
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. You are temporarily blocked.',
          code: 'RATE_LIMIT_BLOCKED',
          retryAfter: Math.ceil(blockDuration / 1000)
        }, 429);
      }
      clientData.count++;
    } else {
      rateLimitMap.set(clientIP, {
        count: 1,
        resetTime: now + windowMs,
        blocked: false
      });
    }
    
    // Add rate limit headers to response
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, maxRequests - (clientData?.count || 1)).toString());
    c.header('X-RateLimit-Reset', (clientData?.resetTime || (now + windowMs)).toString());
    
    await next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Continue without rate limiting if there's an error
    await next();
  }
};

// Request ID middleware for tracking
export const requestId = async (c: Context<CustomContext>, next: Next) => {
  const requestId = c.req.header('X-Request-ID') || 
                   `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  c.header('X-Request-ID', requestId);
  c.set('requestId', requestId);
  
  await next();
};

// Performance monitoring middleware
export const performanceMonitor = async (c: Context<CustomContext>, next: Next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();
  
  await next();
  
  const endTime = Date.now();
  const endMemory = process.memoryUsage();
  const responseTime = endTime - startTime;
  const memoryDelta = {
    rss: endMemory.rss - startMemory.rss,
    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
    heapTotal: endMemory.heapTotal - startMemory.heapTotal
  };
  
  // Log slow requests
  if (responseTime > 1000) { // 1 second threshold
    console.warn(`Slow request detected: ${c.req.method} ${c.req.path} took ${responseTime}ms`);
  }
  
  // Add performance headers
  c.header('X-Response-Time', `${responseTime}ms`);
  c.header('X-Memory-Usage', `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`);
  
  // Log performance metrics in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Performance: ${c.req.method} ${c.req.path} - ${responseTime}ms - Memory: +${Math.round(memoryDelta.heapUsed / 1024)}KB`);
  }
};

// API versioning middleware
export const apiVersioning = async (c: Context<CustomContext>, next: Next) => {
  const apiVersion = c.req.header('X-API-Version') || 'v1';
  c.set('apiVersion', apiVersion);
  
  // Add version header to response
  c.header('X-API-Version', apiVersion);
  
  await next();
};

// Database health check middleware
export const databaseHealthCheck = async (c: Context<CustomContext>, next: Next) => {
  try {
    // This could be enhanced to actually check database connectivity
    // For now, we'll just continue
    await next();
  } catch (error) {
    console.error('Database health check failed:', error);
    return c.json({
      error: 'Service Unavailable',
      message: 'Database connection failed',
      code: 'DATABASE_ERROR'
    }, 503);
  }
};

// Export all middleware for easy import
export const allMiddleware = {
  enhancedLogger,
  securityHeaders,
  corsConfig,
  requestValidator,
  rateLimiter,
  requestId,
  performanceMonitor,
  apiVersioning,
  databaseHealthCheck,
  // Hono built-in middleware
  prettyJSON: () => prettyJSON(),
  timing: () => timing()
};

// Export the custom context type
export type { CustomContext };
