import jwt, { SignOptions } from 'jsonwebtoken';
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
 * Generate an access token
 * @param payload - JWT payload
 * @returns Access token
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  try {
    const token = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
      algorithm: jwtConfig.algorithm,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    } as SignOptions);
    return token;
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
};

/**
 * Generate a refresh token
 * @param payload - JWT payload
 * @returns Refresh token
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
  try {
    const token = jwt.sign(payload, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn,
      algorithm: jwtConfig.algorithm,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    } as SignOptions);
    return token;
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
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
  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    }) as JwtPayload;
    return decoded;
  } catch (error) {
    logger.error('Error verifying access token:', error);
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify a refresh token
 * @param token - Refresh token
 * @returns Decoded payload
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, jwtConfig.refreshSecret, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    }) as JwtPayload;
    return decoded;
  } catch (error) {
    logger.error('Error verifying refresh token:', error);
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Decode a token without verification (for debugging)
 * @param token - JWT token
 * @returns Decoded payload
 */
export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
};

