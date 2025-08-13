import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { 
  authenticateUser, 
  createUser, 
  getUserById, 
  initAuthTable,
  authMiddleware,
  refreshAccessToken,
  revokeRefreshToken
} from '../lib/auth';

// Define the context type for Hono
interface AuthContext {
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

// Define the authentication result type
interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
    created_at: string;
    updated_at: string;
    isAdmin: boolean;
  };
  token?: string;
  refreshToken?: string;
  isAdmin?: boolean;
  error?: string;
}

const authRoutes = new Hono<AuthContext>();

// Initialize auth table on startup
authRoutes.use('*', async (c, next) => {
  await initAuthTable();
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

    const result = await createUser(email, password, name);

    if (result.success && result.user) {
      return c.json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          created_at: result.user.created_at,
          updated_at: result.user.updated_at,
          isAdmin: false
        },
        token: result.token,
        refreshToken: result.refreshToken
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

    const result: AuthResult = await authenticateUser(email, password);

    if (result.success && result.user && result.token) {
      return c.json({
        success: true,
        message: 'Login successful',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          created_at: result.user.created_at,
          updated_at: result.user.updated_at,
          isAdmin: result.isAdmin || false
        },
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

    const result = await refreshAccessToken(refreshToken);

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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        updated_at: user.updated_at,
        isAdmin: user.isAdmin
      }
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

    // For now, just return success - you can implement actual update logic later
    return c.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: name || user.name,
        created_at: user.created_at,
        updated_at: new Date().toISOString(),
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Logout endpoint (revoke refresh token)
authRoutes.post('/logout', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    if (user) {
      // Revoke refresh token
      await revokeRefreshToken(user.id, user.isAdmin);
    }
    
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
    const sql = neon(process.env.DATABASE_URL!);
    
    // Check users table
    const users = await sql`SELECT id, email, name, created_at FROM users`;
    
    // Check admin_users table
    const adminUsers = await sql`SELECT id, email, name, created_at FROM admin_users`;
    
    return c.json({
      success: true,
      debug: {
        usersTable: {
          count: users.length,
          users: users
        },
        adminUsersTable: {
          count: adminUsers.length,
          users: adminUsers
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
