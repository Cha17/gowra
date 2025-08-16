import { Context, Next } from 'hono';
import { verifyAccessToken } from '../lib/auth';
import { createDbClient } from '../db/types';
import type { EnvBinding } from '../schema/env';

// Define the user context type
interface UserContext {
  Bindings: EnvBinding;
  Variables: {
    user: {
      id: string;
      email: string;
      name?: string;
      role?: string;
      isAdmin?: boolean;
    };
  };
}

// Middleware to check if user is authenticated
export const requireAuth = async (c: Context<UserContext>, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'No token provided' }, 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const result = await verifyAccessToken(token, c.env.JWT_SECRET);
    
    if (!result.success || !result.user) {
      return c.json({ success: false, error: result.error || 'Invalid token' }, 401);
    }
    
    // Ensure user has required fields
    if (result.user.id && result.user.email) {
      c.set('user', result.user);
      await next();
    } else {
      return c.json({ success: false, error: 'Invalid token payload' }, 401);
    }
  } catch (error) {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }
};

// Middleware to check if user is an organizer
export const requireOrganizer = async (c: Context<UserContext>, next: Next) => {
  // First check if user is authenticated
  await requireAuth(c, async () => {});
  
  const user = c.get('user');
  
  if (!user || user.role !== 'organizer') {
    return c.json({ 
      success: false, 
      error: 'Organizer role required',
      needsUpgrade: true 
    }, 403);
  }
  
  await next();
};

// Middleware to check if user owns the event (for editing/deleting)
export const requireEventOwnership = async (c: Context<UserContext>, next: Next) => {
  // First check if user is authenticated and is organizer
  await requireOrganizer(c, async () => {});
  
  const user = c.get('user');
  const eventId = c.req.param('id');
  
  if (!eventId) {
    return c.json({ success: false, error: 'Event ID required' }, 400);
  }
  
  // Check if user owns this event
  const db = createDbClient({
    connection_string: c.env.DATABASE_URL,
  });
  
  const event = await db
    .selectFrom('events')
    .select(['id', 'organizer', 'organizer_id'])
    .where('id', '=', eventId)
    .executeTakeFirst();
  
  if (!event) {
    return c.json({ success: false, error: 'Event not found' }, 404);
  }
  
  // Check ownership by either organizer field or organizer_id
  const isOwner = event.organizer === (user.name || user.email) || 
                  event.organizer_id === user.id;
  
  if (!isOwner) {
    return c.json({ success: false, error: 'Not authorized to modify this event' }, 403);
  }
  
  await next();
};
