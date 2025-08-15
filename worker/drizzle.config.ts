import { defineConfig } from 'drizzle-kit';

/**
 * Production Drizzle Configuration
 * This connects to your main production database
 * 
 * For Cloudflare Workers, we need to provide the connection string directly
 * or use environment variables from the local environment
 */
export default defineConfig({
  // Schema location - where our table definitions are
  schema: './src/db/schema.ts',
  
  // Output directory for migration files
  out: './drizzle',
  
  // Database driver (Neon uses PostgreSQL)
  dialect: 'postgresql',
  
  // Production database connection
  // Note: You'll need to set this manually or use a local .env file
  dbCredentials: {
    url: 'postgresql://neondb_owner:npg_VoaHOG2Crd6g@ep-damp-grass-a1b3ka51.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  },
  
  // Verbose logging to see what's happening
  verbose: true,
  
  // Strict mode for safety
  strict: true,
});
