/**
 * S3 Service
 * AWS S3 file storage operations
 */

import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Initialize S3 client
const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = env.AWS_S3_BUCKET;
const INVOICES_FOLDER = 'invoices';

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
}

export default class S3Service {
  /**
   * Upload a file to S3
   */
  static async uploadFile(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string,
    folder: string = INVOICES_FOLDER
  ): Promise<UploadResult> {
    // Generate unique key
    const ext = path.extname(originalFilename).toLowerCase();
    const key = `${folder}/${uuidv4()}-${Date.now()}${ext}`;

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        })
      );

      const url = `https://${BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

      logger.info('File uploaded to S3', { key, bucket: BUCKET_NAME });

      return {
        key,
        url,
        bucket: BUCKET_NAME,
      };
    } catch (error) {
      logger.error('Error uploading file to S3:', error);
      throw error;
    }
  }

  /**
   * Delete a file from S3
   */
  static async deleteFile(key: string): Promise<void> {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        })
      );

      logger.info('File deleted from S3', { key });
    } catch (error) {
      logger.error('Error deleting file from S3:', error);
      throw error;
    }
  }

  /**
   * Get a presigned URL for downloading a file
   */
  static async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      logger.error('Error getting presigned URL:', error);
      throw error;
    }
  }

  /**
   * Get a presigned URL for uploading a file
   */
  static async getUploadPresignedUrl(
    filename: string,
    mimeType: string,
    folder: string = INVOICES_FOLDER,
    expiresIn: number = 3600
  ): Promise<{ uploadUrl: string; key: string }> {
    const ext = path.extname(filename).toLowerCase();
    const key = `${folder}/${uuidv4()}-${Date.now()}${ext}`;

    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: mimeType,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

      return { uploadUrl, key };
    } catch (error) {
      logger.error('Error getting upload presigned URL:', error);
      throw error;
    }
  }

  /**
   * Check if a file exists in S3
   */
  static async fileExists(key: string): Promise<boolean> {
    try {
      await s3Client.send(
        new HeadObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        })
      );
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Extract S3 key from full URL
   */
  static extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Remove leading slash
      return urlObj.pathname.slice(1);
    } catch {
      return null;
    }
  }
}

