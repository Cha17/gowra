import { defineConfig } from 'drizzle-kit';

/**
 * Staging Drizzle Configuration
 * This connects to your staging database branch (safe for testing)
 */
export default defineConfig({
  // Schema location - same as production (we want identical structures)
  schema: './src/db/schema.ts',
  
  // Output directory for staging migrations (separate from production)
  out: './drizzle-staging',
  
  // Database driver (Neon uses PostgreSQL)
  dialect: 'postgresql',
  
  // Staging database connection (your staging branch)
  dbCredentials: {
    url: 'postgresql://neondb_owner:npg_VoaHOG2Crd6g@ep-frosty-bar-a191vjzk.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  },
  
  // Verbose logging to see what's happening
  verbose: true,
  
  // Strict mode for safety
  strict: true,
});
