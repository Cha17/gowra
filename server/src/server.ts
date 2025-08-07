import { serve } from '@hono/node-server';
import app from './index';

const port = process.env.PORT || 8080;

console.log(`🚀 Starting Event Management System API server...`);
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🌐 Server will be available at: http://localhost:${port}`);

const server = serve({
  fetch: app.fetch,
  port: Number(port),
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

console.log('✅ Server started successfully!'); 