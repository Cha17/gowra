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

// Auth result type
export interface AuthResult {
  success: boolean;
  user?: CleanUser;
  token?: string;
  isAdmin?: boolean;
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

// Generate JWT token
export const generateToken = (user: { id: string; email: string; name?: string; isAdmin?: boolean }): string => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      isAdmin: user.isAdmin
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
      const token = generateToken({ ...user, isAdmin: false });
      
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
        token 
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
      const token = generateToken({ ...user, isAdmin: true });
      
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
        token 
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
        const token = generateToken({ 
          id: adminUser.id, 
          email: adminUser.email, 
          name: adminUser.name, 
          isAdmin: true 
        });
        
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
          token, 
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
        const token = generateToken({ 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          isAdmin: false 
        });
        
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
          token, 
          isAdmin: false 
        };
      }
    }
    
    return { success: false, error: 'Invalid email or password' };
  } catch (error) {
    return { success: false, error: 'Authentication failed' };
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
  
  if (!user.isAdmin) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  await next();
}; 