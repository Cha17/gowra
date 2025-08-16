import { Hono } from 'hono';
import { createDbClient } from '../db/types';
import { 
  authenticateUser, 
  createUser, 
  getUserById, 
  initAuthTables,
  authMiddleware,
  refreshAccessToken,
  generateAccessToken,
} from '../lib/auth';
import { requireAuth } from '../middlewares/auth';
import type { EnvBinding } from '../schema/env';

// Define the context type for Hono
interface AuthContext {
  Bindings: EnvBinding;
  Variables: {
    user: {
      id: string;
      email: string;
      name?: string;
      created_at: string;
      updated_at: string;
      isAdmin: boolean;
    };
  };
}

const authRoutes = new Hono<AuthContext>();

// Initialize auth table on startup
authRoutes.use('*', async (c, next) => {
  const db = createDbClient({
    connection_string: c.env.DATABASE_URL,
  });
  await initAuthTables(db, c.env);
  await next();
});

// Register endpoint
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters long' }, 400);
    }

    if (!email.includes('@')) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });

    const result = await createUser(email, password, name, db);

    if (result.success && result.user) {
      return c.json({
        success: true,
        message: 'User registered successfully',
        user: result.user
      });
    } else {
      return c.json({ error: result.error }, 400);
    }
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Login endpoint
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });

    const result = await authenticateUser(email, password, db, c.env);

    if (result.success && result.user && result.token) {
      return c.json({
        success: true,
        message: 'Login successful',
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken,
        isAdmin: result.isAdmin || false
      });
    } else {
      return c.json({ error: result.error }, 401);
    }
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Refresh token endpoint
authRoutes.post('/refresh', async (c) => {
  try {
    const body = await c.req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return c.json({ error: 'Refresh token is required' }, 400);
    }

    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });

    const result = await refreshAccessToken(refreshToken, db, c.env);

    if (result.success && result.token) {
      return c.json({
        success: true,
        message: 'Token refreshed successfully',
        token: result.token,
        user: result.user
      });
    } else {
      return c.json({ error: result.error }, 401);
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get current user endpoint (protected)
authRoutes.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update user profile endpoint (protected)
authRoutes.put('/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { name } = body;

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });

    // Update user profile
    const tableName = user.isAdmin ? 'admin_users' as const : 'users' as const;
    const updatedUser = await db
      .updateTable(tableName)
      .set({ 
        name: name || user.name,
        updated_at: new Date()
      })
      .where('id', '=', user.id)
      .returning(['id', 'email', 'name', 'created_at', 'updated_at'])
      .executeTakeFirst();

    if (updatedUser) {
      return c.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          ...updatedUser,
          isAdmin: user.isAdmin
        }
      });
    } else {
      return c.json({ error: 'Failed to update profile' }, 500);
    }
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Upgrade to organizer endpoint (protected)
authRoutes.post('/upgrade-to-organizer', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { 
      organization_name, 
      organization_type, 
      event_types, 
      organization_description, 
      organization_website 
    } = body;

    // Validation
    if (!organization_name || !organization_type) {
      return c.json({ 
        success: false, 
        error: 'Organization name and type are required' 
      }, 400);
    }

    if (!Array.isArray(event_types) || event_types.length === 0) {
      return c.json({ 
        success: false, 
        error: 'At least one event type is required' 
      }, 400);
    }

    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });

    // Check if user is already an organizer
    if (user.role === 'organizer') {
      return c.json({ 
        success: false, 
        error: 'User is already an organizer' 
      }, 400);
    }

    // Update user to organizer role
    const updatedUser = await db
      .updateTable('users')
      .set({ 
        role: 'organizer',
        organization_name,
        organization_type,
        event_types: JSON.stringify(event_types),
        organization_description: organization_description || null,
        organization_website: organization_website || null,
        organizer_since: new Date(),
        updated_at: new Date()
      })
      .where('id', '=', user.id)
      .returning([
        'id', 'email', 'name', 'role', 'organization_name', 'organization_type',
        'event_types', 'organization_description', 'organization_website', 
        'organizer_since', 'created_at', 'updated_at'
      ])
      .executeTakeFirst();

    if (updatedUser) {
      // Generate new token with updated role
      const newToken = await generateAccessToken({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name || undefined,
        role: 'organizer',
        isAdmin: false
      }, c.env.JWT_SECRET);
      
      return c.json({
        success: true,
        message: 'Successfully upgraded to organizer',
        user: {
          ...updatedUser,
          event_types: JSON.parse(updatedUser.event_types || '[]'),
          isAdmin: false
        },
        token: newToken // Return new token with updated role
      });
    } else {
      return c.json({ 
        success: false, 
        error: 'Failed to upgrade user to organizer' 
      }, 500);
    }
  } catch (error) {
    console.error('Upgrade to organizer error:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
});

// Logout endpoint
authRoutes.post('/logout', authMiddleware, async (c) => {
  try {
    return c.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Debug endpoint to check database state (remove in production)
authRoutes.get('/debug/users', async (c) => {
  try {
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    // Check users table
    const users = await db.selectFrom('users').selectAll().execute();
    
    // Check admin_users table
    const adminUsers = await db.selectFrom('admin_users').selectAll().execute();
    
    return c.json({
      success: true,
      debug: {
        usersTable: {
          count: users.length,
          users: users.map(u => ({ id: u.id, email: u.email, name: u.name, created_at: u.created_at }))
        },
        adminUsersTable: {
          count: adminUsers.length,
          users: adminUsers.map(u => ({ id: u.id, email: u.email, name: u.name, created_at: u.created_at }))
        },
        message: 'Database state retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to retrieve database state',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export { authRoutes };
