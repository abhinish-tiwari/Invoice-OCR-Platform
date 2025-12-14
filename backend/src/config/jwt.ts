import { env } from './env';

export const jwtConfig = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
  refreshSecret: env.JWT_REFRESH_SECRET,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  algorithm: 'HS256' as const,
  issuer: 'invoice-ocr-api',
  audience: 'invoice-ocr-client',
};

export default jwtConfig;

