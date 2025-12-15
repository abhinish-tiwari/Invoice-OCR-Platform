import { logger } from '../utils/logger';

export interface EnvConfig {
		NODE_ENV: string;
		PORT: number;
		CORS_ORIGIN: string;

		DB_HOST: string;
		DB_PORT: number;
		DB_NAME: string;
		DB_USER: string;
		DB_PASSWORD: string;

		JWT_SECRET: string;
		JWT_EXPIRES_IN: string;
		JWT_REFRESH_SECRET: string;
		JWT_REFRESH_EXPIRES_IN: string;

		AWS_REGION: string;
		AWS_ACCESS_KEY_ID: string;
		AWS_SECRET_ACCESS_KEY: string;
		AWS_S3_BUCKET: string;

		LOG_LEVEL: string;
}
