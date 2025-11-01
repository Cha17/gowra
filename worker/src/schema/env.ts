import { z } from "zod";

export const EnvBindingSchema = z.object({
	ENVIRONMENT: z.union([
		z.literal("development"),
		z.literal("staging"),
		z.literal("sandbox"),
		z.literal("production"),
	]),
	DATABASE_URL: z.string(),
	JWT_SECRET: z.string(),
	JWT_REFRESH_SECRET: z.string(),
	ADMIN_EMAILS: z.string(),
  NEXTAPI_BASE_URL: z.string(),
  NEXTPAY_API_KEY: z.string(),
  NEXTPAY_SECRET_KEY: z.string(),
  NEXTPAY_TIMEOUT: z.number().min(1000).max(60000).optional().default(30000),
  NEXTPAY_RETRY_ATTEMPTS: z.number().min(1).max(10).optional().default(3),
  NEXTAPI_CREATE_INTENT_PATH: z.string().optional(),
  NEXTPAY_ACCOUNT_ID: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  // Optional merchant configuration for QRPH/EMVCo fallback
  MERCHANT_NAME: z.string().optional(),
  MERCHANT_CITY: z.string().optional(),
  COUNTRY_CODE: z.string().optional(), // e.g., PH
  CURRENCY_NUMERIC: z.string().optional(), // e.g., 608
  MERCHANT_CATEGORY_CODE: z.string().optional(), // e.g., 5812
  QRPH_AID: z.string().optional(), // scheme AID / GUI
  QRPH_MERCHANT_ID: z.string().optional(),
  QRPH_MAI_TAG: z.enum(['26','51']).optional(),
});

export type EnvBinding = z.infer<typeof EnvBindingSchema>;
