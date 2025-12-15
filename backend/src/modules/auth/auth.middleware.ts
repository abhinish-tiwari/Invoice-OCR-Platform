import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { verifyAccessToken } from '../../utils/jwt.util';
import { UnauthorizedError, ForbiddenError } from '../../middleware/error.middleware';
import MESSAGES from '../../constants/messages';
import { logger } from '../../utils/logger';

/**
 * Middleware to authenticate user using JWT token
 * Extracts and verifies the Bearer token from Authorization header
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new UnauthorizedError(MESSAGES.AUTH_MESSAGES.UNAUTHORIZED);
		}

		const token = authHeader.substring(7);
		const payload = verifyAccessToken(token);

		req.user = {
			userId: payload.userId,
			email: payload.email,
			role: payload.role,
		};

		next();
	} catch (error) {
		logger.error('Authentication error:', error);
		next(new UnauthorizedError(MESSAGES.AUTH_MESSAGES.INVALID_TOKEN));
	}
};

/**
 * Middleware to authorize user based on allowed roles
 * @param allowedRoles - Array of roles that are permitted to access the route
 */
export const authorize = (...allowedRoles: string[]) => {
	return (req: Request, _res: Response, next: NextFunction): void => {
		try {
			if (!req.user) {
				throw new UnauthorizedError(MESSAGES.AUTH_MESSAGES.UNAUTHORIZED);
			}

			const userRole = req.user.role || 'user';

			if (!allowedRoles.includes(userRole)) {
				throw new ForbiddenError(MESSAGES.AUTH_MESSAGES.FORBIDDEN);
			}

			next();
		} catch (error) {
			next(error);
		}
	};
};

/**
 * Middleware to validate request data using Zod schema
 * Validates body, query, and params against the provided schema
 * @param schema - Zod schema to validate against
 */
export const validate = (schema: ZodSchema) => {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			await schema.parseAsync({
				body: req.body,
				query: req.query,
				params: req.params,
			});

			next();
		} catch (error: any) {
			logger.error('Validation error:', error);

			res.status(400).json({
				success: false,
				error: {
					message: 'Validation failed',
					statusCode: 400,
					details: error.errors || error.message,
				},
			});
		}
	};
};

export default { authenticate, authorize, validate };