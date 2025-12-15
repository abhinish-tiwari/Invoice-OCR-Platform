import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { logger } from './logger';

export interface JwtPayload {
	userId: string;
	email: string;
	role?: string;
}

export interface TokenPair {
	accessToken: string;
	refreshToken: string;
}

/**
 * Common sign options for JWT tokens
 */
const getSignOptions = (): SignOptions => ({
	algorithm: jwtConfig.algorithm,
	issuer: jwtConfig.issuer,
	audience: jwtConfig.audience,
});

/**
 * Common verify options for JWT tokens
 */
const getVerifyOptions = (): VerifyOptions => ({
	algorithms: [jwtConfig.algorithm],
	issuer: jwtConfig.issuer,
	audience: jwtConfig.audience,
});

/**
 * Generate a JWT token
 * @param payload - JWT payload
 * @param secret - Secret key
 * @param expiresIn - Token expiration time
 * @param tokenType - Type of token (for logging)
 * @returns JWT token
 */
const generateToken = (payload: JwtPayload, secret: string, expiresIn: string, tokenType: string): string => {
	try {
		return jwt.sign(payload, secret, {
			...getSignOptions(),
			expiresIn,
		} as SignOptions);
	} catch (error) {
		logger.error(`Error generating ${tokenType}:`, error);
		throw new Error(`Failed to generate ${tokenType}`);
	}
};

/**
 * Verify a JWT token
 * @param token - JWT token
 * @param secret - Secret key
 * @param tokenType - Type of token (for logging)
 * @returns Decoded payload
 */
const verifyToken = (token: string, secret: string, tokenType: string): JwtPayload => {
	try {
		return jwt.verify(token, secret, getVerifyOptions()) as JwtPayload;
	} catch (error) {
		logger.error(`Error verifying ${tokenType}:`, error);
		throw new Error(`Invalid or expired ${tokenType}`);
	}
};

/**
 * Generate an access token
 * @param payload - JWT payload
 * @returns Access token
 */
export const generateAccessToken = (payload: JwtPayload): string => {
	return generateToken(payload, jwtConfig.secret, jwtConfig.expiresIn, 'access token');
};

/**
 * Generate a refresh token
 * @param payload - JWT payload
 * @returns Refresh token
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
	return generateToken(payload, jwtConfig.refreshSecret, jwtConfig.refreshExpiresIn, 'refresh token');
};

/**
 * Generate both access and refresh tokens
 * @param payload - JWT payload
 * @returns Token pair
 */
export const generateTokenPair = (payload: JwtPayload): TokenPair => {
	return {
		accessToken: generateAccessToken(payload),
		refreshToken: generateRefreshToken(payload),
	};
};

/**
 * Verify an access token
 * @param token - Access token
 * @returns Decoded payload
 */
export const verifyAccessToken = (token: string): JwtPayload => {
	return verifyToken(token, jwtConfig.secret, 'access token');
};

/**
 * Verify a refresh token
 * @param token - Refresh token
 * @returns Decoded payload
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
	return verifyToken(token, jwtConfig.refreshSecret, 'refresh token');
};

/**
 * Decode a token without verification (for debugging)
 * @param token - JWT token
 * @returns Decoded payload or null
 */
export const decodeToken = (token: string): JwtPayload | null => {
	return jwt.decode(token) as JwtPayload | null;
};