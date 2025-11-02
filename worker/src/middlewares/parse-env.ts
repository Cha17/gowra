import { createMiddleware } from "hono/factory";
import { env } from "hono/adapter";

import { EnvBindingSchema } from "../schema/env";

export const parseEnvMiddleware = createMiddleware(async (c, next) => {
	c.env = env(c);

	try {
		EnvBindingSchema.passthrough().parse(c.env);
	} catch (error) {
		// Format Zod errors more clearly
		if (error && typeof error === 'object' && 'errors' in error) {
			const zodError = error as { errors: Array<{ path: (string | number)[], message: string, code: string }> };
			const formattedErrors = JSON.stringify(zodError.errors, null, 2);
			console.error('Environment validation failed:', formattedErrors);
			return c.json(
				{
					success: false,
					error: 'Invalid environment variables',
					details: zodError.errors,
					message: 'The API server is misconfigured. Please check environment variables.',
				},
				500
			);
		}
		throw new Error(`Invalid environment variables: ${error}`);
	}

	await next();
});
