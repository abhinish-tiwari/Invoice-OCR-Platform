import { Pool, PoolConfig, PoolClient, QueryResult } from 'pg';
import { logger } from '../utils/logger';
import { env } from './env';

const poolConfig: PoolConfig = {
	host: env.DB_HOST,
	port: env.DB_PORT,
	database: env.DB_NAME,
	user: env.DB_USER,
	password: env.DB_PASSWORD,
	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

pool.on('connect', () => {
	logger.info('✅ Database connected successfully');
});

pool.on('error', (err: Error) => {
	logger.error('❌ Unexpected database error:', err);
	process.exit(-1);
});

/**
 * Execute a database query with logging
 * @param text - SQL query string
 * @param params - Query parameters
 * @returns Query result
 */
export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
	const start = Date.now();
	try {
		const result = await pool.query(text, params);
		const duration = Date.now() - start;
		logger.debug('Executed query', { text, duration, rows: result.rowCount });
		return result;
	} catch (error) {
		logger.error('Query error:', { text, error });
		throw error;
	}
};

/**
 * Get a client from the pool for transactions
 * Includes timeout monitoring and proper cleanup
 * @returns Database client
 */
export const getClient = async (): Promise<PoolClient> => {
	const client = await pool.connect();
	const originalQuery = client.query.bind(client);
	const originalRelease = client.release.bind(client);

	const CLIENT_TIMEOUT = 5000;
	const timeout = setTimeout(() => {
		logger.error('A client has been checked out for more than 5 seconds!');
	}, CLIENT_TIMEOUT);

	// Override query method to maintain original behavior
	client.query = (...args: any[]): any => {
		return originalQuery(...args);
	};

	// Override release method to clear timeout and restore original methods
	client.release = (): void => {
		clearTimeout(timeout);
		client.query = originalQuery;
		client.release = originalRelease;
		originalRelease();
	};

	return client;
};

/**
 * Test database connection on startup
 * @returns True if connection successful, false otherwise
 */
export const testConnection = async (): Promise<boolean> => {
	try {
		const result = await pool.query('SELECT NOW()');
		logger.info('✅ Database connection test successful', {
			time: result.rows[0].now,
		});
		return true;
	} catch (error) {
		logger.error('❌ Database connection test failed:', error);
		return false;
	}
};

export default pool;