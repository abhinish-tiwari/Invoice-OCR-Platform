import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Constants
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_DIR = path.join(__dirname, '../../logs');
const MAX_FILE_SIZE = 5242880; // 5MB
const MAX_FILES = 5;

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length 
      ? JSON.stringify(meta, null, 2) 
      : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

// Base format for all transports
const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Logger configuration
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: baseFormat,
  defaultMeta: { service: 'invoice-ocr-api' },
  transports: [
    // Console transport with custom formatting
    new winston.transports.Console({
      format: consoleFormat
    }),
    // Error log file
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: MAX_FILE_SIZE,
      maxFiles: MAX_FILES
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      maxsize: MAX_FILE_SIZE,
      maxFiles: MAX_FILES
    })
  ]
});
