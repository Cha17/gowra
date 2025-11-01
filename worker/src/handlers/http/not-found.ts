import type { Context } from "hono";

export async function notFoundHandler(c: Context) {
	return c.json(
		{ message: "Not Found" },
		{
			status: 404,
		},
	);
}
