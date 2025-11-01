import { createMiddleware } from "hono/factory";
import { env } from "hono/adapter";

import { EnvBindingSchema } from "../schema/env";

export const parseEnvMiddleware = createMiddleware(async (c, next) => {
	c.env = env(c);

	try {
		EnvBindingSchema.passthrough().parse(c.env);
	} catch (error) {
		throw new Error(`Invalid environment variables: ${error}`);
	}

	await next();
});
