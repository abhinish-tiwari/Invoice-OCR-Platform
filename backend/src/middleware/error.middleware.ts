import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
	statusCode: number;
	isOperational: boolean;

	constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends AppError {
	constructor(message: string) {
		super(message, 400);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message: string = 'Unauthorized') {
		super(message, 401);
	}
}

export class ForbiddenError extends AppError {
	constructor(message: string = 'Forbidden') {
		super(message, 403);
	}
}

export class NotFoundError extends AppError {
	constructor(message: string = 'Resource not found') {
		super(message, 404);
	}
}

export class ConflictError extends AppError {
	constructor(message: string) {
		super(message, 409);
	}
}

export class InternalServerError extends AppError {
	constructor(message: string = 'Internal server error') {
		super(message, 500);
	}
}

export const errorHandler = ( err: Error | AppError, req: Request, res: Response, _next: NextFunction) => {
	let statusCode = 500;
	let message = 'Internal server error';

	if (err instanceof AppError) {
		statusCode = err.statusCode;
		message = err.message;
	}

	// Log error
	logger.error('Error occurred:', {
		message: err.message,
		stack: err.stack,
		statusCode,
		path: req.path,
		method: req.method,
		ip: req.ip,
		userId: (req as any).user?.userId,
	});

	res.status(statusCode).json({
		success: false,
		error: {
			message,
			statusCode,
		},
	});
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
	const error = new NotFoundError(`Route ${req.originalUrl} not found`);
	next(error);
};

export const asyncHandler = (fn: Function) => {
	return (req: Request, res: Response, next: NextFunction) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
};