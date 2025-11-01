export abstract class HttpError extends Error {
	constructor(
		public statusCode: number,
		message: string,
	) {
		super(message);
		this.name = this.constructor.name;
	}
}

export class NotFoundError extends HttpError {
	constructor(message: string) {
		super(404, message);
	}
}

export class BadRequestError extends HttpError {
	constructor(message: string) {
		super(400, message);
	}
}

export class UnprocessableEntityError extends HttpError {
	constructor(message: string) {
		super(422, message);
	}
}

export class GenericHttpError extends HttpError {
	constructor(message: string) {
		super(500, message);
	}
}

export class UnauthorizedError extends HttpError {
	constructor(message: string) {
		super(401, message);
	}
}

export class AccessForbiddenError extends HttpError {
	constructor(message: string) {
		super(403, message);
	}
}
