import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';
import { env } from './env';

const poolConfig: PoolConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  logger.info('✅ Database connected successfully');
});

pool.on('error', (err: Error) => {
  logger.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Helper function to execute queries
export const query = async (text: string, params?: any[]) => {
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

// Helper function to get a client from the pool for transactions
export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;

  // Set a timeout of 5 seconds
  const timeout = setTimeout(() => {
    logger.error('A client has been checked out for more than 5 seconds!');
  }, 5000);

  // Monkey patch the query method
  (client.query as any) = (...args: any[]) => {
    return query.apply(client, args as any);
  };

  (client.release as any) = () => {
    clearTimeout(timeout);
    (client.query as any) = query;
    (client.release as any) = release;
    return release.apply(client);
  };

  return client;
};

// Test connection on startup
export const testConnection = async (): Promise<boolean> => {
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info('✅ Database connection test successful', { time: result.rows[0].now });
    return true;
  } catch (error) {
    logger.error('❌ Database connection test failed:', error);
    return false;
  }
};

export default pool;

