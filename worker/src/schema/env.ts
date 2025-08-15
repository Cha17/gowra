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
});

export type EnvBinding = z.infer<typeof EnvBindingSchema>;
