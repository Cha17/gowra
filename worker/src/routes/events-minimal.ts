import { Hono } from 'hono';
import { requireAuth, requireOrganizer } from '../middlewares/auth';
import type { EnvBinding } from '../schema/env';

const eventRoutes = new Hono<{ Bindings: EnvBinding }>();

// Simple test endpoint
eventRoutes.get('/test', async (c) => {
  return c.json({ success: true, message: 'Events route works' });
});

// Test endpoint with auth middleware
eventRoutes.get('/test-auth', requireAuth, async (c) => {
  const user = c.get('user');
  return c.json({ 
    success: true, 
    message: 'Auth middleware works',
    user: { id: user.id, name: user.name, role: user.role }
  });
});

// Test endpoint with both middlewares
eventRoutes.get('/test-organizer', requireAuth, requireOrganizer, async (c) => {
  const user = c.get('user');
  return c.json({ 
    success: true, 
    message: 'Organizer middleware works',
    user: { id: user.id, name: user.name, role: user.role }
  });
});

export { eventRoutes };
