import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

interface EnvConfig {
  // Server
  NODE_ENV: string;
  PORT: number;
  CORS_ORIGIN: string;

  // Database
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;

  // AWS
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_S3_BUCKET: string;

  // Logging
  LOG_LEVEL: string;
}

const getEnvVariable = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    logger.error(`Missing required environment variable: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env: EnvConfig = {
  // Server
  NODE_ENV: getEnvVariable('NODE_ENV', 'development'),
  PORT: parseInt(getEnvVariable('PORT', '3000')),
  CORS_ORIGIN: getEnvVariable('CORS_ORIGIN', 'http://localhost:5173'),

  // Database
  DB_HOST: getEnvVariable('DB_HOST', 'localhost'),
  DB_PORT: parseInt(getEnvVariable('DB_PORT', '5432')),
  DB_NAME: getEnvVariable('DB_NAME', 'invoice_ocr'),
  DB_USER: getEnvVariable('DB_USER', 'postgres'),
  DB_PASSWORD: getEnvVariable('DB_PASSWORD'),

  // JWT
  JWT_SECRET: getEnvVariable('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnvVariable('JWT_EXPIRES_IN', '1h'),
  JWT_REFRESH_SECRET: getEnvVariable('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRES_IN: getEnvVariable('JWT_REFRESH_EXPIRES_IN', '7d'),

  // AWS
  AWS_REGION: getEnvVariable('AWS_REGION', 'us-east-1'),
  AWS_ACCESS_KEY_ID: getEnvVariable('AWS_ACCESS_KEY_ID'),
  AWS_SECRET_ACCESS_KEY: getEnvVariable('AWS_SECRET_ACCESS_KEY'),
  AWS_S3_BUCKET: getEnvVariable('AWS_S3_BUCKET'),

  // Logging
  LOG_LEVEL: getEnvVariable('LOG_LEVEL', 'info'),
};

export default env;

