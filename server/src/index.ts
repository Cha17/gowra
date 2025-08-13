import { Hono } from 'hono';

// Import organized middleware and types
import { allMiddleware, CustomContext } from './lib/middleware';

// Import routes
import { authRoutes } from './routes/auth';
import { adminRoutes } from './routes/admin';
// import { eventRoutes } from './routes/events';
// import { registrationRoutes } from './routes/registrations';
// import { paymentRoutes } from './routes/payments';

// Create Hono app instance with custom context
const app = new Hono<CustomContext>();

// ===== PHASE 3, STEP 3.1: HONO SERVER SETUP =====

// 1. Initialize Hono server with proper middleware configuration
// 2. Set up CORS middleware for cross-origin requests
// 3. Configure logging middleware for debugging
// 4. Set up error handling middleware
// 5. Create route structure for different API endpoints

// ===== MIDDLEWARE CONFIGURATION =====

// Apply all middleware in the correct order
app.use('*', allMiddleware.enhancedLogger);
app.use('*', allMiddleware.requestId);
app.use('*', allMiddleware.apiVersioning);
app.use('*', allMiddleware.performanceMonitor);
app.use('*', allMiddleware.securityHeaders);
app.use('*', allMiddleware.corsConfig);
app.use('*', allMiddleware.timing());
app.use('*', allMiddleware.requestValidator);
app.use('*', allMiddleware.rateLimiter);
app.use('*', allMiddleware.databaseHealthCheck);

// Pretty JSON middleware for development only
if (process.env.NODE_ENV === 'development') {
  app.use('*', allMiddleware.prettyJSON());
}

// ===== ROUTE STRUCTURE =====

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Event Management System API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      events: '/api/events (coming soon)',
      registrations: '/api/registrations (coming soon)',
      payments: '/api/payments (coming soon)'
    }
  });
});

// API status endpoint
app.get('/api/status', (c) => {
  return c.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'connected',
    services: {
      auth: 'active',
      admin: 'active',
      events: 'planned',
      registrations: 'planned',
      payments: 'planned'
    }
  });
});

// API routes with versioning
app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/admin', adminRoutes);
// app.route('/api/v1/events', eventRoutes);
// app.route('/api/v1/registrations', registrationRoutes);
// app.route('/api/v1/payments', paymentRoutes);

// Legacy route support (redirect to v1)
app.route('/api/auth', authRoutes);
app.route('/api/admin', adminRoutes);

// ===== ERROR HANDLING MIDDLEWARE =====

// 404 handler for unmatched routes
app.notFound((c) => {
  const timestamp = new Date().toISOString();
  const requestId = c.get('requestId') || 'unknown';
  
  console.log(`[${timestamp}] 404 Not Found: ${c.req.method} ${c.req.url} - Request ID: ${requestId}`);
  
  return c.json({ 
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: c.req.path,
    method: c.req.method,
    timestamp: timestamp,
    requestId: requestId,
    suggestion: 'Check the API documentation for available endpoints'
  }, 404);
});

// Global error handler
app.onError((err, c) => {
  const timestamp = new Date().toISOString();
  const errorId = Math.random().toString(36).substring(2, 15);
  const requestId = c.get('requestId') || 'unknown';
  
  // Log error details
  console.error(`[${timestamp}] Error ID: ${errorId} - Request ID: ${requestId}`);
  console.error('Server Error:', err);
  console.error('Request Details:', {
    method: c.req.method,
    path: c.req.path,
    headers: c.req.header()
  });
  console.error('Stack Trace:', err.stack);
  
  // Return appropriate error response
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return c.json({ 
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong on our end',
    errorId: errorId,
    requestId: requestId,
    timestamp: timestamp,
    ...(isDevelopment && {
      details: err.message,
      stack: err.stack
    })
  }, 500);
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
