import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import type { EnvBinding } from "./schema/env";
import { parseEnvMiddleware } from "./middlewares/parse-env";
import { notFoundHandler } from "./handlers/http/not-found";
import { onErrorHandler } from "./handlers/http/on-error";
import { createDbClient } from "./db/types";

// Import route handlers
import { authRoutes } from "./routes/auth";
import { adminRoutes } from "./routes/admin";
import { eventRoutes } from "./routes/events-simple";
import { registrationRoutes } from "./routes/registrations";
import { paymentRoutes } from "./routes/payments";

const appBase = new Hono<{
	Bindings: EnvBinding;
}>();

const app = appBase
	.use(logger())
	.use(cors({
		origin: '*',
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization'],
	}))
	.use(parseEnvMiddleware)

	.get("/health", (c) => {
		return c.json({ status: "ok", message: "Gowra Events API is running" });
	})
  .get("/testdb", async (c) => {
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    const users = await db.selectFrom("users").selectAll().execute();
    return c.json({ users });
  })

	// API Routes
	.route("/api/auth", authRoutes)
	.route("/api/admin", adminRoutes)
	.route("/api/events", eventRoutes)
	.route("/api/registrations", registrationRoutes)
	.route("/api/payments", paymentRoutes)

	.notFound(notFoundHandler)
	.onError(onErrorHandler);

export default app;
