import { Context, Next } from 'hono';
import { createDbClient } from '../db/types';
import { verifyAccessToken } from '../lib/auth';

export interface UserContext {
  id: string;
  email: string;
  name?: string | null;
  role: 'user' | 'organizer';
  organization_name?: string | null;
  organization_type?: string | null;
  event_types?: string | null;
  organization_description?: string | null;
  organization_website?: string | null;
  organizer_since?: string | null;
  created_at: string;
  updated_at: string;
  isAdmin: boolean;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: UserContext;
  }
}

// Middleware to require authentication
export const requireAuth = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    console.log('🔍 Auth middleware - Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Auth middleware - No valid token provided');
      return c.json({ success: false, error: 'No token provided' }, 401);
    }

    const token = authHeader.substring(7);
    const secret = c.env.JWT_SECRET;
    console.log('🔍 Auth middleware - Token length:', token.length);
    console.log('🔍 Auth middleware - JWT_SECRET configured:', !!secret);
    console.log('🔍 Auth middleware - JWT_SECRET length:', secret ? secret.length : 0);
    
    if (!secret) {
      console.error('JWT_SECRET not configured');
      return c.json({ success: false, error: 'Server configuration error' }, 500);
    }

    // Verify JWT token using our custom verification
    const result = await verifyAccessToken(token, secret);
    if (!result.success || !result.user) {
      return c.json({ success: false, error: result.error || 'Invalid token' }, 401);
    }

    const payload = result.user;
    if (!payload.id) {
      return c.json({ success: false, error: 'Invalid token payload' }, 401);
    }

    // Fetch fresh user data from database
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });

    const user = await db
      .selectFrom('users')
      .select([
        'id',
        'email',
        'name',
        'role',
        'organization_name',
        'organization_type',
        'event_types',
        'organization_description',
        'organization_website',
        'organizer_since',
        'created_at',
        'updated_at'
      ])
      .where('id', '=', payload.id as string)
      .executeTakeFirst();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 401);
    }

    // Create user context with isAdmin flag and convert dates to strings
    const userContext: UserContext = {
      ...user,
      organizer_since: user.organizer_since ? user.organizer_since.toString() : null,
      created_at: user.created_at.toString(),
      updated_at: user.updated_at.toString(),
      isAdmin: false // Regular users and organizers are not admins
    };

    c.set('user', userContext);
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ success: false, error: 'Authentication failed' }, 401);
  }
};

// Middleware to require organizer role
export const requireOrganizer = async (c: Context, next: Next) => {
  const user = c.get('user');
  
  if (!user || user.role !== 'organizer') {
    return c.json({ 
      success: false, 
      error: 'Organizer access required' 
    }, 403);
  }

  await next();
};

// Middleware to require event ownership
export const requireEventOwnership = async (c: Context, next: Next) => {
  try {
    const user = c.get('user');
    const eventId = c.req.param('id');
    
    if (!user || !eventId) {
      return c.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, 401);
    }

    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });

    // Check if user owns this event
    const event = await db
      .selectFrom('events')
      .select(['organizer', 'organizer_id'])
      .where('id', '=', eventId)
      .executeTakeFirst();

    if (!event) {
      return c.json({ 
        success: false, 
        error: 'Event not found' 
      }, 404);
    }

    // Check ownership - either legacy organizer field or new organizer_id field
    const isOwner = event.organizer === user.name || 
                   event.organizer === user.email || 
                   event.organizer_id === user.id;

    if (!isOwner) {
      return c.json({ 
        success: false, 
        error: 'Access denied - you do not own this event' 
      }, 403);
    }

    await next();
  } catch (error) {
    console.error('Event ownership check error:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
};
