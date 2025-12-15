import rateLimit, { Options } from 'express-rate-limit';
import MESSAGES from '../constants/messages';
import { Request, Response } from 'express';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const createRateLimitResponse = (message: string) => ({
	success: false,
	error: {
		message,
		statusCode: 429,
	},
});

const createRateLimiter = (windowMs: number, max: number, message: string, options: Partial<Options> = {}) => {
	return rateLimit({
		windowMs,
		max,
		message: createRateLimitResponse(message),
		standardHeaders: true,
		legacyHeaders: false,
		handler: (_req: Request, res: Response) => {
			res.status(429).json(createRateLimitResponse(message));
		},
		...options
	});
};

export const apiLimiter = createRateLimiter(
	FIFTEEN_MINUTES,
	100,
	MESSAGES.RATE_LIMIT_MESSAGES.TOO_MANY_REQUESTS
);

export const authLimiter = createRateLimiter(
	FIFTEEN_MINUTES,
	5,
	MESSAGES.RATE_LIMIT_MESSAGES.AUTH_LIMIT_EXCEEDED,
	{ skipSuccessfulRequests: true }
);

export const uploadLimiter = createRateLimiter(
	ONE_HOUR,
	10,
	MESSAGES.RATE_LIMIT_MESSAGES.UPLOAD_LIMIT_EXCEEDED
);