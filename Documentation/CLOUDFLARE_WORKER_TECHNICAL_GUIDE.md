# Cloudflare Worker Technical Implementation Guide

## Overview

This guide provides specific technical details for migrating the Node.js/Hono backend to Cloudflare Workers while maintaining Neon Database integration.

## Architecture Comparison

### Current (Node.js Server)

```
Node.js Runtime → Hono Framework → Neon DB (HTTP)
- Uses @hono/node-server adapter
- Node.js APIs (crypto, process, etc.)
- bcryptjs for password hashing
- File system access for logs
```

### Target (Cloudflare Worker)

```
V8 Isolate → Hono Framework → Neon DB (HTTP)
- Direct Hono Worker integration
- Web APIs (Crypto API, etc.)
- Web Crypto API for password hashing
- Worker logging and analytics
```

## Key Technical Changes

### 1. Runtime Environment

**From Node.js APIs:**

```typescript
import { serve } from "@hono/node-server";
import bcrypt from "bcryptjs";
import * as crypto from "crypto";
```

**To Web APIs:**

```typescript
// No server adapter needed - direct export
export default { fetch: app.fetch };

// Web Crypto API
const crypto = globalThis.crypto;
```

### 2. Database Connection

**Current (server/src/db/connection.ts):**

```typescript
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Works in both Node.js and Workers
neonConfig.fetchConnectionCache = true;
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });
```

**Worker Implementation (identical):**

```typescript
// Same code works in Workers!
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

neonConfig.fetchConnectionCache = true;
const sql = neon(env.DATABASE_URL); // env from Worker context
const db = drizzle(sql, { schema });
```

### 3. Authentication Changes

**Current (bcryptjs):**

```typescript
import bcrypt from "bcryptjs";

// Hash password
const hashedPassword = await bcrypt.hash(password, 12);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

**Worker (Web Crypto API):**

```typescript
// Utility functions using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(hashBuffer);
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
}
```

### 4. Environment Variables

**Current (process.env):**

```typescript
const port = process.env.PORT || 8080;
const dbUrl = process.env.DATABASE_URL;
```

**Worker (Bindings):**

```typescript
interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ADMIN_EMAILS: string;
}

// In handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const dbUrl = env.DATABASE_URL;
    // ...
  },
};
```

### 5. Error Handling

**Current (Node.js process handlers):**

```typescript
process.on("SIGTERM", () => {
  console.log("Shutting down...");
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});
```

**Worker (Global error handling):**

```typescript
// Built into Worker runtime - no manual process handlers needed
// Errors are automatically caught and returned as 500 responses

app.onError((err, c) => {
  console.error("Worker error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});
```

## File Structure Migration

### Current Structure

```
server/src/
├── server.ts              # Node.js server entry
├── index.ts               # Hono app definition
├── db/
│   ├── connection.ts      # Database connection
│   ├── schema.ts          # Drizzle schema
│   └── types.ts           # TypeScript types
├── lib/
│   ├── auth.ts            # Authentication logic
│   ├── middleware.ts      # Hono middleware
│   └── logger.ts          # Logging utilities
└── routes/
    ├── auth.ts            # Auth endpoints
    ├── admin.ts           # Admin endpoints
    └── *.ts               # Other routes
```

### Target Structure

```
worker/src/
├── index.ts               # Worker entry point
├── db/
│   ├── connection.ts      # Worker-adapted connection
│   ├── schema.ts          # Same schema (copied)
│   └── types.ts           # Same types (copied)
├── lib/
│   ├── auth.ts            # Web Crypto-based auth
│   ├── middleware.ts      # Worker-adapted middleware
│   └── crypto.ts          # Web Crypto utilities
└── routes/
    ├── auth.ts            # Same endpoints (adapted)
    ├── admin.ts           # Same endpoints (adapted)
    └── *.ts               # Other routes (adapted)
```

## Specific Code Migrations

### 1. Worker Entry Point (worker/src/index.ts)

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Import routes (same structure as server)
import { authRoutes } from "./routes/auth";
import { adminRoutes } from "./routes/admin";
// ... other routes

interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ADMIN_EMAILS: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware (same as server)
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"], // Add your domains
    credentials: true,
  })
);

// Routes (same structure as server)
app.route("/api/auth", authRoutes);
app.route("/api/admin", adminRoutes);
// ... other routes

// Health check
app.get("/", (c) => {
  return c.json({ message: "Worker API is running" });
});

export default app;
```

### 2. Database Connection (worker/src/db/connection.ts)

```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";

// Configure Neon for Workers
neonConfig.fetchConnectionCache = true;

let db: any = null;
let sql: any = null;

export function initializeDb(databaseUrl: string) {
  if (!sql) {
    sql = neon(databaseUrl);
    db = drizzle(sql, { schema });
  }
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}

export function getSql() {
  if (!sql) {
    throw new Error("Database not initialized");
  }
  return sql;
}
```

### 3. Authentication with Web Crypto (worker/src/lib/crypto.ts)

```typescript
// Web Crypto API utilities for password hashing
export class WebCrypto {
  static async hashPassword(password: string, salt?: string): Promise<string> {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    // Generate salt if not provided
    if (!salt) {
      const saltBuffer = crypto.getRandomValues(new Uint8Array(16));
      salt = this.bufferToHex(saltBuffer);
    }

    const saltData = encoder.encode(salt);

    // Combine password and salt
    const combined = new Uint8Array(passwordData.length + saltData.length);
    combined.set(passwordData);
    combined.set(saltData, passwordData.length);

    // Hash using PBKDF2
    const key = await crypto.subtle.importKey(
      "raw",
      passwordData,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltData,
        iterations: 100000,
        hash: "SHA-256",
      },
      key,
      256
    );

    const hash = this.bufferToHex(hashBuffer);
    return `${salt}:${hash}`;
  }

  static async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    const [salt, hash] = hashedPassword.split(":");
    const newHash = await this.hashPassword(password, salt);
    return newHash === hashedPassword;
  }

  static bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  static async generateJWT(payload: any, secret: string): Promise<string> {
    // Simple JWT implementation using Web Crypto API
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));

    const data = `${encodedHeader}.${encodedPayload}`;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const secretBuffer = encoder.encode(secret);

    const key = await crypto.subtle.importKey(
      "raw",
      secretBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, dataBuffer);
    const encodedSignature = btoa(
      String.fromCharCode(...new Uint8Array(signature))
    );

    return `${data}.${encodedSignature}`;
  }

  static async verifyJWT(token: string, secret: string): Promise<any> {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    // Verify signature
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const secretBuffer = encoder.encode(secret);

    const key = await crypto.subtle.importKey(
      "raw",
      secretBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signature = Uint8Array.from(atob(encodedSignature), (c) =>
      c.charCodeAt(0)
    );
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      dataBuffer
    );

    if (!isValid) {
      throw new Error("Invalid JWT signature");
    }

    return JSON.parse(atob(encodedPayload));
  }
}
```

### 4. Updated Authentication Routes (worker/src/routes/auth.ts)

```typescript
import { Hono } from "hono";
import { initializeDb } from "../db/connection";
import { WebCrypto } from "../lib/crypto";
import * as schema from "../db/schema";

interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ADMIN_EMAILS: string;
}

const authRoutes = new Hono<{ Bindings: Env }>();

// Initialize database middleware
authRoutes.use("*", async (c, next) => {
  const db = initializeDb(c.env.DATABASE_URL);
  c.set("db", db);
  await next();
});

// Login endpoint
authRoutes.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    const db = c.get("db");

    // Find user
    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!user.length) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // Verify password
    const isValid = await WebCrypto.verifyPassword(password, user[0].password);
    if (!isValid) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // Generate JWT
    const payload = {
      id: user[0].id,
      email: user[0].email,
      isAdmin: user[0].isAdmin,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    };

    const token = await WebCrypto.generateJWT(payload, c.env.JWT_SECRET);

    return c.json({
      success: true,
      user: {
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        isAdmin: user[0].isAdmin,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Register endpoint
authRoutes.post("/register", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    const db = c.get("db");

    // Check if user exists
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existing.length) {
      return c.json({ error: "User already exists" }, 409);
    }

    // Hash password
    const hashedPassword = await WebCrypto.hashPassword(password);

    // Create user
    const newUser = await db
      .insert(schema.users)
      .values({
        email,
        password: hashedPassword,
        name,
        isAdmin: false,
      })
      .returning();

    return c.json({
      success: true,
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        name: newUser[0].name,
        isAdmin: newUser[0].isAdmin,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { authRoutes };
```

### 5. Wrangler Configuration (worker/wrangler.toml)

```toml
name = "gowra-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[env.development]
name = "gowra-api-dev"
vars = { NODE_ENV = "development" }

[env.staging]
name = "gowra-api-staging"
vars = { NODE_ENV = "staging" }

[env.production]
name = "gowra-api-prod"
vars = { NODE_ENV = "production" }

# Secrets (set using: wrangler secret put SECRET_NAME)
# DATABASE_URL
# JWT_SECRET
# JWT_REFRESH_SECRET
# ADMIN_EMAILS
```

### 6. Package.json for Worker

```json
{
  "name": "worker",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy --minify",
    "deploy:staging": "wrangler deploy --env staging --minify",
    "deploy:production": "wrangler deploy --env production --minify",
    "cf-typegen": "wrangler types --env-interface CloudflareBindings",
    "test": "vitest",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "hono": "^4.9.1",
    "@neondatabase/serverless": "^1.0.1",
    "drizzle-orm": "^0.44.4"
  },
  "devDependencies": {
    "wrangler": "^4.4.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

## Migration Checklist

### Pre-Migration

- [ ] Backup current server code
- [ ] Verify Neon DB access and credentials
- [ ] Set up Cloudflare account and Workers access
- [ ] Prepare environment variables/secrets

### Core Migration

- [ ] Set up Worker project structure
- [ ] Install dependencies
- [ ] Migrate database schema and connection
- [ ] Implement Web Crypto authentication
- [ ] Port all API routes
- [ ] Adapt middleware for Workers
- [ ] Configure Wrangler

### Testing

- [ ] Test locally with `wrangler dev`
- [ ] Verify all endpoints work
- [ ] Test authentication flow
- [ ] Validate database operations
- [ ] Test error handling

### Deployment

- [ ] Deploy to staging environment
- [ ] Run integration tests
- [ ] Compare performance with original
- [ ] Deploy to production
- [ ] Monitor and validate

## Key Benefits

1. **Global Performance**: Edge deployment reduces latency
2. **Scalability**: Automatic scaling with zero configuration
3. **Cost Efficiency**: Pay-per-request pricing model
4. **Security**: Built-in DDoS protection and security features
5. **Simplicity**: No server management required

## Potential Challenges

1. **CPU Time Limits**: 50ms execution time (100ms on paid plans)
2. **Memory Limits**: 128MB per request
3. **Cold Starts**: Usually <1ms but worth monitoring
4. **Debugging**: Different debugging experience than Node.js
5. **Dependencies**: Ensure all packages are Worker-compatible

This guide provides the technical foundation for a successful migration while maintaining full compatibility with your existing Neon database and API structure.
