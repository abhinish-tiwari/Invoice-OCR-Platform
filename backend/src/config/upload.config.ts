import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { ValidationError } from '../middleware/error.middleware';
import MESSAGES from '../constants/messages';
import S3Service from '../services/s3.service';
import { logger } from '../utils/logger';
import { env } from './env';

// Allowed file types for invoice uploads
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Storage mode from environment
const STORAGE_MODE = env.STORAGE_MODE;

// Upload directory path (for local storage)
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'invoices');

// Ensure upload directory exists (for local storage)
const ensureUploadDir = (): void => {
  if (STORAGE_MODE === 'local' && !fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

// Initialize upload directory for local mode
if (STORAGE_MODE === 'local') {
  ensureUploadDir();
}

/**
 * Multer storage configuration
 * For S3: uses memory storage (upload to S3 in controller)
 * For local: uses disk storage
 */
const storage = STORAGE_MODE === 's3'
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req: Request, _file: Express.Multer.File, cb) => {
        ensureUploadDir();
        cb(null, UPLOAD_DIR);
      },
      filename: (_req: Request, file: Express.Multer.File, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `${uuidv4()}-${Date.now()}${ext}`;
        cb(null, uniqueName);
      },
    });

/**
 * File filter to validate uploaded files
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError(MESSAGES.INVOICE_MESSAGES.INVALID_FILE_TYPE));
  }
};

/**
 * Multer upload configuration for invoice files
 */
export const invoiceUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

/**
 * Upload file to storage (S3 or local)
 */
export const uploadToStorage = async (
  file: Express.Multer.File
): Promise<{ url: string; key?: string }> => {
  if (STORAGE_MODE === 's3') {
    // Upload to S3
    const result = await S3Service.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype
    );
    return { url: result.url, key: result.key };
  } else {
    // Local storage - file already saved by multer
    return { url: `/uploads/invoices/${file.filename}` };
  }
};

/**
 * Get the public URL for an uploaded file
 */
export const getFileUrl = (filename: string): string => {
  if (STORAGE_MODE === 's3') {
    // For S3, the filename IS the full URL
    return filename;
  }
  return `/uploads/invoices/${filename}`;
};

/**
 * Delete a file from storage
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    if (STORAGE_MODE === 's3') {
      const key = S3Service.extractKeyFromUrl(fileUrl);
      if (key) {
        await S3Service.deleteFile(key);
      }
    } else {
      const filename = path.basename(fileUrl);
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    logger.error('Error deleting file:', error);
  }
};

/**
 * Get current storage mode
 */
export const getStorageMode = (): string => STORAGE_MODE;

export default invoiceUpload;

