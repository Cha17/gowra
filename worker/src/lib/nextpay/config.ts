import { z } from "zod";
import type { EnvBinding } from "../../schema/env";
import type { NextPayConfig } from "./types";

// Extended environment schema for NextPay
export const NextPayEnvSchema = z.object({
  NEXTAPI_BASE_URL: z.string().url(),
  NEXTPAY_API_KEY: z.string().min(1),
  NEXTPAY_SECRET_KEY: z.string().min(1),
  NEXTPAY_TIMEOUT: z.number().min(1000).max(60000).optional().default(30000),
  NEXTPAY_RETRY_ATTEMPTS: z.number().min(1).max(10).optional().default(3),
  NEXTPAY_ACCOUNT_ID: z.string().optional(),
});

export type NextPayEnvBinding = z.infer<typeof NextPayEnvSchema>;

/**
 * Loads and validates NextPay configuration from environment variables
 * @param env - Environment binding containing NextPay configuration
 * @returns Validated NextPay configuration
 * @throws Error if required environment variables are missing or invalid
 */
export function loadNextPayConfig(env: EnvBinding): NextPayConfig {
  try {
    // Check for missing credentials first with helpful error message
    const missingCreds = [];
    if (!env.NEXTPAY_API_KEY) missingCreds.push('NEXTPAY_API_KEY');
    if (!env.NEXTPAY_SECRET_KEY) missingCreds.push('NEXTPAY_SECRET_KEY');
    if (!env.NEXTAPI_BASE_URL) missingCreds.push('NEXTAPI_BASE_URL');
    
    if (missingCreds.length > 0) {
      throw new Error(
        `Missing NextPay credentials: ${missingCreds.join(', ')}. ` +
        `Please set these secrets in Cloudflare: ${missingCreds.map(c => 'wrangler secret put ' + c + ' --env staging').join(' or ')}`
      );
    }
    
    // Validate the environment variables
    const validatedEnv = NextPayEnvSchema.parse({
      NEXTAPI_BASE_URL: env.NEXTAPI_BASE_URL!,
      NEXTPAY_API_KEY: env.NEXTPAY_API_KEY!,
      NEXTPAY_SECRET_KEY: env.NEXTPAY_SECRET_KEY!,
      NEXTPAY_TIMEOUT: env.NEXTPAY_TIMEOUT,
      NEXTPAY_RETRY_ATTEMPTS: env.NEXTPAY_RETRY_ATTEMPTS,
      NEXTPAY_ACCOUNT_ID: env.NEXTPAY_ACCOUNT_ID,
    });

    return {
      baseUrl: validatedEnv.NEXTAPI_BASE_URL,
      clientId: validatedEnv.NEXTPAY_API_KEY,
      clientSecret: validatedEnv.NEXTPAY_SECRET_KEY,
      timeout: validatedEnv.NEXTPAY_TIMEOUT,
      retryAttempts: validatedEnv.NEXTPAY_RETRY_ATTEMPTS,
      accountId: validatedEnv.NEXTPAY_ACCOUNT_ID,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`NextPay configuration validation failed: ${errorMessages}`);
    }
    throw new Error(`Failed to load NextPay configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates that all required NextPay environment variables are present
 * @param env - Environment binding to validate
 * @returns true if all required variables are present
 */
export function validateNextPayEnv(env: Partial<EnvBinding>): boolean {
  const required = ['NEXTAPI_BASE_URL', 'NEXTPAY_API_KEY', 'NEXTPAY_SECRET_KEY'];
  return required.every(key => env[key as keyof EnvBinding] && String(env[key as keyof EnvBinding]).trim() !== '');
}
