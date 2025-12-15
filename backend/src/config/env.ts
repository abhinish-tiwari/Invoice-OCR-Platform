import dotenv from 'dotenv';
import { logger } from '../utils/logger';
import { EnvConfig } from '../types/env';

dotenv.config();

const getEnvVariable = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    logger.error(`Missing required environment variable: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env: EnvConfig = {
  NODE_ENV: getEnvVariable('NODE_ENV', 'development'),
  PORT: parseInt(getEnvVariable('PORT', '3000')),
  CORS_ORIGIN: getEnvVariable('CORS_ORIGIN', 'http://localhost:5173'),

  DB_HOST: getEnvVariable('DB_HOST', 'localhost'),
  DB_PORT: parseInt(getEnvVariable('DB_PORT', '5432')),
  DB_NAME: getEnvVariable('DB_NAME', 'invoice_ocr'),
  DB_USER: getEnvVariable('DB_USER', 'postgres'),
  DB_PASSWORD: getEnvVariable('DB_PASSWORD'),

  JWT_SECRET: getEnvVariable('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnvVariable('JWT_EXPIRES_IN', '1h'),
  JWT_REFRESH_SECRET: getEnvVariable('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRES_IN: getEnvVariable('JWT_REFRESH_EXPIRES_IN', '7d'),

  AWS_REGION: getEnvVariable('AWS_REGION', 'us-east-1'),
  AWS_ACCESS_KEY_ID: getEnvVariable('AWS_ACCESS_KEY_ID'),
  AWS_SECRET_ACCESS_KEY: getEnvVariable('AWS_SECRET_ACCESS_KEY'),
  AWS_S3_BUCKET: getEnvVariable('AWS_S3_BUCKET'),

  LOG_LEVEL: getEnvVariable('LOG_LEVEL', 'info'),
};
