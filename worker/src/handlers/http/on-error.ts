import type { ContentfulStatusCode, StatusCode } from "hono/utils/http-status";
import type { EnvBinding } from "../../schema/env";
import { HttpError } from "../../schema/http-errors";
import type { Context } from "hono";

export async function onErrorHandler(
	error: Error,
	c: Context<{
		Bindings: EnvBinding;
	}>,
) {
	const statusCode = (
		error instanceof HttpError ? error.statusCode : 500
	) as ContentfulStatusCode;

	if (c.env.ENVIRONMENT === "development") {
		return c.json(error, { status: statusCode });
	}

	return c.json({ name: error.name, message: error.message }, statusCode);
}
