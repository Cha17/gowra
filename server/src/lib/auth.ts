import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

// Database connection
const sql = neon(process.env.DATABASE_URL!);

// JWT secret keys
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days

// User type for server
export interface ServerUser {
  id: string;
  email: string;
  name?: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

// Admin user type for server
export interface ServerAdminUser {
  id: string;
  email: string;
  name?: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

// Clean user type for responses (without password_hash)
export interface CleanUser {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
  isAdmin: boolean;
}

// Auth result type with refresh token
export interface AuthResult {
  success: boolean;
  user?: CleanUser;
  token?: string;
  refreshToken?: string;
  isAdmin?: boolean;
  error?: string;
}

// Refresh token result type
export interface RefreshResult {
  success: boolean;
  token?: string;
  user?: CleanUser;
  error?: string;
}

// Create user table if it doesn't exist
export const initAuthTable = async () => {
  // Create regular users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  // Create admin users table
  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  // Create refresh tokens table
  await sql`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  // Create admin refresh tokens table
  await sql`
    CREATE TABLE IF NOT EXISTS admin_refresh_tokens (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    )
  `;

  // Create default admin user if it doesn't exist
  const adminExists = await sql`
    SELECT id FROM admin_users WHERE email = 'admin@gowra.com'
  `;
  
  if (!adminExists || adminExists.length === 0) {
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const passwordHash = await hashPassword(defaultPassword);
    
    await sql`
      INSERT INTO admin_users (email, name, password_hash)
      VALUES ('admin@gowra.com', 'Admin', ${passwordHash})
    `;
    console.log('Default admin user created: admin@gowra.com');
  }
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Verify password
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Generate JWT access token
export const generateAccessToken = (user: { id: string; email: string; name?: string; isAdmin?: boolean }): string => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      isAdmin: user.isAdmin,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

// Generate JWT refresh token
export const generateRefreshToken = (user: { id: string; email: string; name?: string; isAdmin?: boolean }): string => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      isAdmin: user.isAdmin,
      type: 'refresh'
    },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

// Verify JWT access token
export const verifyAccessToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'access') {
      return { success: false, error: 'Invalid token type' };
    }
    return { success: true, user: decoded };
  } catch (error) {
    return { success: false, error: 'Invalid token' };
  }
};

// Verify JWT refresh token
export const verifyRefreshToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
    if (decoded.type !== 'refresh') {
      return { success: false, error: 'Invalid token type' };
    }
    return { success: true, user: decoded };
  } catch (error) {
    return { success: false, error: 'Invalid token' };
  }
};

// Store refresh token in database
export const storeRefreshToken = async (userId: string, refreshToken: string, isAdmin: boolean = false): Promise<boolean> => {
  try {
    const tokenHash = await hashPassword(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    if (isAdmin) {
      await sql`
        INSERT INTO admin_refresh_tokens (user_id, token_hash, expires_at)
        VALUES (${userId}, ${tokenHash}, ${expiresAt})
      `;
    } else {
      await sql`
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES (${userId}, ${tokenHash}, ${expiresAt})
      `;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to store refresh token:', error);
    return false;
  }
};

// Validate refresh token from database
export const validateRefreshToken = async (userId: string, refreshToken: string, isAdmin: boolean = false): Promise<boolean> => {
  try {
    let tokens;
    
    if (isAdmin) {
      tokens = await sql`
        SELECT token_hash, expires_at 
        FROM admin_refresh_tokens 
        WHERE user_id = ${userId} AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `;
    } else {
      tokens = await sql`
        SELECT token_hash, expires_at 
        FROM refresh_tokens 
        WHERE user_id = ${userId} AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `;
    }
    
    if (!tokens || tokens.length === 0) {
      return false;
    }
    
    const tokenHash = tokens[0].token_hash;
    return await verifyPassword(refreshToken, tokenHash);
  } catch (error) {
    console.error('Failed to validate refresh token:', error);
    return false;
  }
};

// Revoke refresh token
export const revokeRefreshToken = async (userId: string, isAdmin: boolean = false): Promise<boolean> => {
  try {
    if (isAdmin) {
      await sql`
        DELETE FROM admin_refresh_tokens WHERE user_id = ${userId}
      `;
    } else {
      await sql`
        DELETE FROM refresh_tokens WHERE user_id = ${userId}
      `;
    }
    return true;
  } catch (error) {
    console.error('Failed to revoke refresh token:', error);
    return false;
  }
};

// Create user
export const createUser = async (email: string, password: string, name?: string): Promise<AuthResult> => {
  try {
    const passwordHash = await hashPassword(password);
    
    const result = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email}, ${name}, ${passwordHash})
      RETURNING id, email, name, created_at, updated_at
    `;
    
    if (result && result.length > 0) {
      const user = result[0] as { id: string; email: string; name?: string; created_at: string; updated_at: string };
      const accessToken = generateAccessToken({ ...user, isAdmin: false });
      const refreshToken = generateRefreshToken({ ...user, isAdmin: false });
      
      // Store refresh token
      await storeRefreshToken(user.id, refreshToken, false);
      
      // Return clean user object with isAdmin field
      return { 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
          updated_at: user.updated_at,
          isAdmin: false
        }, 
        token: accessToken,
        refreshToken
      };
    }
    
    return { success: false, error: 'Failed to create user' };
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      return { success: false, error: 'Email already exists' };
    }
    return { success: false, error: 'Failed to create user' };
  }
};

// Create admin user
export const createAdminUser = async (email: string, password: string, name?: string): Promise<AuthResult> => {
  try {
    const passwordHash = await hashPassword(password);
    
    const result = await sql`
      INSERT INTO admin_users (email, name, password_hash)
      VALUES (${email}, ${name}, ${passwordHash})
      RETURNING id, email, name, created_at, updated_at
    `;
    
    if (result && result.length > 0) {
      const user = result[0] as { id: string; email: string; name?: string; created_at: string; updated_at: string };
      const accessToken = generateAccessToken({ ...user, isAdmin: true });
      const refreshToken = generateRefreshToken({ ...user, isAdmin: true });
      
      // Store refresh token
      await storeRefreshToken(user.id, refreshToken, true);
      
      // Return clean user object with isAdmin field
      return { 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
          updated_at: user.updated_at,
          isAdmin: true
        }, 
        token: accessToken,
        refreshToken
      };
    }
    
    return { success: false, error: 'Failed to create admin user' };
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      return { success: false, error: 'Email already exists' };
    }
    return { success: false, error: 'Failed to create admin user' };
  }
};

// Authenticate user (regular or admin)
export const authenticateUser = async (email: string, password: string): Promise<AuthResult> => {
  try {
    // First check if it's an admin user
    let adminResult = await sql`
      SELECT id, email, name, password_hash, created_at, updated_at
      FROM admin_users
      WHERE email = ${email}
    `;
    
    if (adminResult && adminResult.length > 0) {
      const adminUser = adminResult[0];
      const isValidPassword = await verifyPassword(password, adminUser.password_hash);
      
      if (isValidPassword) {
        const accessToken = generateAccessToken({ 
          id: adminUser.id, 
          email: adminUser.email, 
          name: adminUser.name, 
          isAdmin: true 
        });
        const refreshToken = generateRefreshToken({ 
          id: adminUser.id, 
          email: adminUser.email, 
          name: adminUser.name, 
          isAdmin: true 
        });
        
        // Store refresh token
        await storeRefreshToken(adminUser.id, refreshToken, true);
        
        // Return clean user object without password_hash
        return { 
          success: true, 
          user: {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            created_at: adminUser.created_at,
            updated_at: adminUser.updated_at,
            isAdmin: true
          }, 
          token: accessToken,
          refreshToken,
          isAdmin: true 
        };
      }
    }

    // If not admin, check regular users
    const userResult = await sql`
      SELECT id, email, name, password_hash, created_at, updated_at
      FROM users
      WHERE email = ${email}
    `;
    
    if (userResult && userResult.length > 0) {
      const user = userResult[0];
      const isValidPassword = await verifyPassword(password, user.password_hash);
      
      if (isValidPassword) {
        const accessToken = generateAccessToken({ 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          isAdmin: false 
        });
        const refreshToken = generateRefreshToken({ 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          isAdmin: false 
        });
        
        // Store refresh token
        await storeRefreshToken(user.id, refreshToken, false);
        
        // Return clean user object without password_hash
        return { 
          success: true, 
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            created_at: user.created_at,
            updated_at: user.updated_at,
            isAdmin: false
          }, 
          token: accessToken,
          refreshToken,
          isAdmin: false 
        };
      }
    }
    
    return { success: false, error: 'Invalid email or password' };
  } catch (error) {
    return { success: false, error: 'Authentication failed' };
  }
};

// Refresh access token
export const refreshAccessToken = async (refreshToken: string): Promise<RefreshResult> => {
  try {
    // Verify refresh token
    const result = verifyRefreshToken(refreshToken);
    if (!result.success || !result.user) {
      return { success: false, error: 'Invalid refresh token' };
    }

    const { id, isAdmin } = result.user;
    
    // Validate refresh token in database
    const isValid = await validateRefreshToken(id, refreshToken, isAdmin);
    if (!isValid) {
      return { success: false, error: 'Refresh token not found or expired' };
    }

    // Get fresh user data
    const userResult = await getUserById(id);
    if (!userResult.success || !userResult.user) {
      return { success: false, error: 'User not found' };
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      id: userResult.user.id,
      email: userResult.user.email,
      name: userResult.user.name,
      isAdmin: userResult.user.isAdmin
    });

    return {
      success: true,
      token: newAccessToken,
      user: userResult.user
    };
  } catch (error) {
    return { success: false, error: 'Token refresh failed' };
  }
};

// Get user by ID
export const getUserById = async (id: string): Promise<AuthResult> => {
  try {
    // Check admin users first
    let result = await sql`
      SELECT id, email, name, created_at, updated_at
      FROM admin_users
      WHERE id = ${id}
    `;
    
    if (result && result.length > 0) {
      const user = result[0];
      return { 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
          updated_at: user.updated_at,
          isAdmin: true
        } 
      };
    }

    // Check regular users
    result = await sql`
      SELECT id, email, name, created_at, updated_at
      FROM users
      WHERE id = ${id}
    `;
    
    if (result && result.length > 0) {
      const user = result[0];
      return { 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
          updated_at: user.updated_at,
          isAdmin: false
        } 
      };
    }
    
    return { success: false, error: 'User not found' };
  } catch (error) {
    return { success: false, error: 'Failed to get user' };
  }
};

// Admin check utility - now checks database instead of environment variables
export const isAdmin = async (user: any) => {
  if (!user || !user.id) return false;
  
  try {
    const result = await sql`
      SELECT id FROM admin_users WHERE id = ${user.id}
    `;
    return result && result.length > 0;
  } catch (error) {
    return false;
  }
};

// Authentication middleware for Hono
export const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'No token provided' }, 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const result = verifyAccessToken(token);

  if (!result.success) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  // Get fresh user data from database
  const userResult = await getUserById(result.user.id);
  if (!userResult.success) {
    return c.json({ error: 'User not found' }, 401);
  }

  // Add user to context
  c.set('user', userResult.user);
  await next();
};

// Admin middleware for Hono
export const adminMiddleware = async (c: any, next: any) => {
  const user = c.get('user');
  
  if (!user.isAdmin) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  await next();
}; 