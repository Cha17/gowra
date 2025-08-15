import { compare, hash } from 'bcrypt-ts';
import { createDbClient, type UserRole } from '../db/types';
import type { EnvBinding } from '../schema/env';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

// User type for worker (includes new organizer fields)
export interface WorkerUser {
  id: string;
  email: string;
  name?: string;
  password_hash: string;
  role: UserRole; // 'user' or 'organizer'
  organization_name?: string;
  organization_type?: string;
  event_types?: string; // JSON string
  organization_description?: string;
  organization_website?: string;
  organizer_since?: string;
  created_at: string;
  updated_at: string;
}

// Clean user type for responses (without password_hash)
export interface CleanUser {
  id: string;
  email: string;
  name?: string;
  role?: UserRole; // 'user' or 'organizer' (only for regular users)
  organization_name?: string;
  organization_type?: string;
  event_types?: string[];
  organization_description?: string;
  organization_website?: string;
  organizer_since?: string;
  created_at: string;
  updated_at: string;
  isAdmin: boolean; // true for admin users, false for regular users
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

// Hash password using bcrypt-ts
export const hashPassword = async (password: string): Promise<string> => {
  return hash(password, 12);
};

// Verify password using bcrypt-ts
export const verifyPassword = async (password: string, hashValue: string): Promise<boolean> => {
  return compare(password, hashValue);
};

// Generate JWT access token using Web Crypto API
export const generateAccessToken = async (user: { id: string; email: string; name?: string; isAdmin?: boolean; role?: UserRole }, secret: string): Promise<string> => {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin || false, // Keep for admin users
    role: user.role, // Add role for regular users ('user' or 'organizer')
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRY
  };

  return createJWT(header, payload, secret);
};

// Generate JWT refresh token using Web Crypto API
export const generateRefreshToken = async (user: { id: string; email: string; name?: string; isAdmin?: boolean; role?: UserRole }, secret: string): Promise<string> => {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin || false,
    role: user.role, // Add role for regular users
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRY
  };

  return createJWT(header, payload, secret);
};

// Helper function to create JWT using Web Crypto API
async function createJWT(header: any, payload: any, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Base64url encode header and payload
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  
  // Create signature
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const encodedSignature = base64urlEncode(new Uint8Array(signature));
  
  return `${data}.${encodedSignature}`;
}

// Helper function to verify JWT using Web Crypto API
async function verifyJWT(token: string, secret: string): Promise<{ success: boolean; payload?: any; error?: string }> {
  try {
    const encoder = new TextEncoder();
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      return { success: false, error: 'Invalid token format' };
    }
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    
    // Verify signature
    const data = `${encodedHeader}.${encodedPayload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = base64urlDecode(encodedSignature);
    const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
    
    if (!isValid) {
      return { success: false, error: 'Invalid signature' };
    }
    
    // Decode payload
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(encodedPayload)));
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { success: false, error: 'Token expired' };
    }
    
    return { success: true, payload };
  } catch (error) {
    return { success: false, error: 'Token verification failed' };
  }
}

// Base64url encoding helper
function base64urlEncode(data: string | Uint8Array): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Base64url decoding helper
function base64urlDecode(data: string): Uint8Array {
  const binary = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Verify JWT access token
export const verifyAccessToken = async (token: string, secret: string) => {
  const result = await verifyJWT(token, secret);
  if (!result.success || !result.payload) {
    return { success: false, error: result.error };
  }
  
  if (result.payload.type !== 'access') {
    return { success: false, error: 'Invalid token type' };
  }
  
  return { success: true, user: result.payload };
};

// Verify JWT refresh token
export const verifyRefreshToken = async (token: string, secret: string) => {
  const result = await verifyJWT(token, secret);
  if (!result.success || !result.payload) {
    return { success: false, error: result.error };
  }
  
  if (result.payload.type !== 'refresh') {
    return { success: false, error: 'Invalid token type' };
  }
  
  return { success: true, user: result.payload };
};

// Create user
export const createUser = async (email: string, password: string, name: string | undefined, db: any): Promise<AuthResult> => {
  try {
    const passwordHash = await hashPassword(password);
    
    const result = await db
      .insertInto('users')
      .values({
        email,
        name,
        password_hash: passwordHash,
        role: 'user', // Explicitly set role to 'user'
      })
      .returning([
        'id', 'email', 'name', 'created_at', 'updated_at',
        'role', 'organization_name', 'organization_type', 'event_types',
        'organization_description', 'organization_website', 'organizer_since'
      ])
      .executeTakeFirst();
    
    if (result) {
      // Return clean user object with all organizer fields
      return { 
        success: true, 
        user: {
          id: result.id,
          email: result.email,
          name: result.name,
          role: result.role,
          organization_name: result.organization_name,
          organization_type: result.organization_type,
          event_types: result.event_types ? JSON.parse(result.event_types) : [],
          organization_description: result.organization_description,
          organization_website: result.organization_website,
          organizer_since: result.organizer_since,
          created_at: result.created_at,
          updated_at: result.updated_at,
          isAdmin: false
        }
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
export const createAdminUser = async (email: string, password: string, name: string | undefined, db: any): Promise<AuthResult> => {
  try {
    const passwordHash = await hashPassword(password);
    
    const result = await db
      .insertInto('admin_users')
      .values({
        email,
        name,
        password_hash: passwordHash,
      })
      .returning(['id', 'email', 'name', 'created_at', 'updated_at'])
      .executeTakeFirst();
    
    if (result) {
      // Return clean user object with isAdmin field
      return { 
        success: true, 
        user: {
          id: result.id,
          email: result.email,
          name: result.name,
          created_at: result.created_at,
          updated_at: result.updated_at,
          isAdmin: true
        }
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
export const authenticateUser = async (email: string, password: string, db: any, env: EnvBinding): Promise<AuthResult> => {
  try {
    // First check if it's an admin user
    const adminResult = await db
      .selectFrom('admin_users')
      .select(['id', 'email', 'name', 'password_hash', 'created_at', 'updated_at'])
      .where('email', '=', email)
      .executeTakeFirst();
    
    if (adminResult) {
      const isValidPassword = await verifyPassword(password, adminResult.password_hash);
      
      if (isValidPassword) {
        const accessToken = await generateAccessToken({ 
          id: adminResult.id, 
          email: adminResult.email, 
          name: adminResult.name, 
          isAdmin: true 
        }, env.JWT_SECRET);
        
        const refreshToken = await generateRefreshToken({ 
          id: adminResult.id, 
          email: adminResult.email, 
          name: adminResult.name, 
          isAdmin: true 
        }, env.JWT_REFRESH_SECRET);
        
        // Return clean user object without password_hash
        return { 
          success: true, 
          user: {
            id: adminResult.id,
            email: adminResult.email,
            name: adminResult.name,
            created_at: adminResult.created_at,
            updated_at: adminResult.updated_at,
            isAdmin: true
          }, 
          token: accessToken,
          refreshToken,
          isAdmin: true 
        };
      }
    }

    // If not admin, check regular users
    const userResult = await db
      .selectFrom('users')
      .select([
        'id', 'email', 'name', 'password_hash', 'created_at', 'updated_at',
        'role', 'organization_name', 'organization_type', 'event_types', 
        'organization_description', 'organization_website', 'organizer_since'
      ])
      .where('email', '=', email)
      .executeTakeFirst();
    
    if (userResult) {
      const isValidPassword = await verifyPassword(password, userResult.password_hash);
      
      if (isValidPassword) {
        const accessToken = await generateAccessToken({ 
          id: userResult.id, 
          email: userResult.email, 
          name: userResult.name, 
          isAdmin: false,
          role: userResult.role // Include user role in JWT
        }, env.JWT_SECRET);
        
        const refreshToken = await generateRefreshToken({ 
          id: userResult.id, 
          email: userResult.email, 
          name: userResult.name, 
          isAdmin: false,
          role: userResult.role // Include user role in refresh token
        }, env.JWT_REFRESH_SECRET);
        
        // Return clean user object without password_hash
        return { 
          success: true, 
          user: {
            id: userResult.id,
            email: userResult.email,
            name: userResult.name,
            role: userResult.role,
            organization_name: userResult.organization_name,
            organization_type: userResult.organization_type,
            event_types: userResult.event_types ? JSON.parse(userResult.event_types) : [],
            organization_description: userResult.organization_description,
            organization_website: userResult.organization_website,
            organizer_since: userResult.organizer_since,
            created_at: userResult.created_at,
            updated_at: userResult.updated_at,
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

// Get user by ID
export const getUserById = async (id: string, db: any): Promise<AuthResult> => {
  try {
    // Check admin users first
    let result = await db
      .selectFrom('admin_users')
      .select(['id', 'email', 'name', 'created_at', 'updated_at'])
      .where('id', '=', id)
      .executeTakeFirst();
    
    if (result) {
      return { 
        success: true, 
        user: {
          id: result.id,
          email: result.email,
          name: result.name,
          created_at: result.created_at,
          updated_at: result.updated_at,
          isAdmin: true
        } 
      };
    }

    // Check regular users
    result = await db
      .selectFrom('users')
      .select(['id', 'email', 'name', 'created_at', 'updated_at'])
      .where('id', '=', id)
      .executeTakeFirst();
    
    if (result) {
      return { 
        success: true, 
        user: {
          id: result.id,
          email: result.email,
          name: result.name,
          created_at: result.created_at,
          updated_at: result.updated_at,
          isAdmin: false
        } 
      };
    }
    
    return { success: false, error: 'User not found' };
  } catch (error) {
    return { success: false, error: 'Failed to get user' };
  }
};

// Refresh access token
export const refreshAccessToken = async (refreshToken: string, db: any, env: EnvBinding): Promise<RefreshResult> => {
  try {
    // Verify refresh token
    const result = await verifyRefreshToken(refreshToken, env.JWT_REFRESH_SECRET);
    if (!result.success || !result.user) {
      return { success: false, error: 'Invalid refresh token' };
    }

    const { id } = result.user;

    // Get fresh user data
    const userResult = await getUserById(id, db);
    if (!userResult.success || !userResult.user) {
      return { success: false, error: 'User not found' };
    }

    // Generate new access token
    const newAccessToken = await generateAccessToken({
      id: userResult.user.id,
      email: userResult.user.email,
      name: userResult.user.name,
      isAdmin: userResult.user.isAdmin
    }, env.JWT_SECRET);

    return {
      success: true,
      token: newAccessToken,
      user: userResult.user
    };
  } catch (error) {
    return { success: false, error: 'Token refresh failed' };
  }
};

// Authentication middleware for Hono
export const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'No token provided' }, 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const result = await verifyAccessToken(token, c.env.JWT_SECRET);

  if (!result.success) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  // Get fresh user data from database
  const db = createDbClient({
    connection_string: c.env.DATABASE_URL,
  });
  
  const userResult = await getUserById(result.user.id, db);
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
  
  if (!user || !user.isAdmin) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  await next();
};

// Initialize auth tables
export const initAuthTables = async (db: any, env: EnvBinding) => {
  // Check if default admin user exists
  const adminExists = await db
    .selectFrom('admin_users')
    .select('id')
    .where('email', '=', 'admin@gowra.com')
    .executeTakeFirst();
  
  if (!adminExists) {
    const defaultPassword = 'admin123';
    const passwordHash = await hashPassword(defaultPassword);
    
    await db
      .insertInto('admin_users')
      .values({
        email: 'admin@gowra.com',
        name: 'Admin',
        password_hash: passwordHash,
      })
      .execute();
    
    console.log('Default admin user created: admin@gowra.com');
  }
};
