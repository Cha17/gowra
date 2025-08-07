import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

// Database connection
const sql = neon(process.env.DATABASE_URL!);

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// User type for server
export interface ServerUser {
  id: string;
  email: string;
  name?: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

// Create user table if it doesn't exist
export const initAuthTable = async () => {
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

// Generate JWT token
export const generateToken = (user: { id: string; email: string; name?: string }): string => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify JWT token
export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { success: true, user: decoded };
  } catch (error) {
    return { success: false, error: 'Invalid token' };
  }
};

// Create user
export const createUser = async (email: string, password: string, name?: string) => {
  try {
    const passwordHash = await hashPassword(password);
    
    const result = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email}, ${name}, ${passwordHash})
      RETURNING id, email, name, created_at, updated_at
    `;
    
    if (result && result.length > 0) {
      const user = result[0] as { id: string; email: string; name?: string; created_at: string; updated_at: string };
      const token = generateToken(user);
      return { success: true, user, token };
    }
    
    return { success: false, error: 'Failed to create user' };
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      return { success: false, error: 'Email already exists' };
    }
    return { success: false, error: 'Failed to create user' };
  }
};

// Authenticate user
export const authenticateUser = async (email: string, password: string) => {
  try {
    const result = await sql`
      SELECT id, email, name, password_hash, created_at, updated_at
      FROM users
      WHERE email = ${email}
    `;
    
    if (result && result.length > 0) {
      const user = result[0];
      const isValidPassword = await verifyPassword(password, user.password_hash);
      
      if (isValidPassword) {
        const token = generateToken(user as { id: string; email: string; name?: string });
        return { success: true, user, token };
      }
    }
    
    return { success: false, error: 'Invalid email or password' };
  } catch (error) {
    return { success: false, error: 'Authentication failed' };
  }
};

// Get user by ID
export const getUserById = async (id: string) => {
  try {
    const result = await sql`
      SELECT id, email, name, created_at, updated_at
      FROM users
      WHERE id = ${id}
    `;
    
    if (result && result.length > 0) {
      return { success: true, user: result[0] };
    }
    
    return { success: false, error: 'User not found' };
  } catch (error) {
    return { success: false, error: 'Failed to get user' };
  }
};

// Admin check utility
export const isAdmin = (user: any) => {
  if (!user || !user.email) return false;
  
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  return adminEmails.includes(user.email);
};

// Authentication middleware for Hono
export const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'No token provided' }, 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const result = verifyToken(token);

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
  
  if (!isAdmin(user)) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  await next();
}; 