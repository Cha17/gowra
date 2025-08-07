import { Hono } from 'hono';
import { 
  authenticateUser, 
  createUser, 
  getUserById, 
  initAuthTable,
  authMiddleware 
} from '../lib/auth';

const authRoutes = new Hono();

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

    if (result.success) {
      return c.json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          created_at: result.user.created_at,
          updated_at: result.user.updated_at
        },
        token: result.token
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

    const result = await authenticateUser(email, password);

    if (result.success) {
      return c.json({
        success: true,
        message: 'Login successful',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          created_at: result.user.created_at,
          updated_at: result.user.updated_at
        },
        token: result.token
      });
    } else {
      return c.json({ error: result.error }, 401);
    }
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get current user endpoint (protected)
authRoutes.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        updated_at: user.updated_at
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

    // For now, just return success - you can implement actual update logic later
    return c.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: name || user.name,
        created_at: user.created_at,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Logout endpoint (client-side token removal)
authRoutes.post('/logout', async (c) => {
  return c.json({
    success: true,
    message: 'Logout successful'
  });
});

export { authRoutes };
