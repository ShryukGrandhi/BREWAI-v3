/**
 * BREWAI v4 MinIO Configuration
 * Author: BUILD-AGENT v1
 * 
 * S3-compatible object storage for session replays and documents.
 */

import { Client } from 'minio';
import { logger } from '../utils/logger';

let minioClient: Client | null = null;

export function getMinIOClient(): Client {
  if (!minioClient) {
    minioClient = new Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
  }
  return minioClient;
}

export async function initMinIO(): Promise<void> {
  const client = getMinIOClient();
  
  const buckets = [
    process.env.MINIO_BUCKET_SESSIONS || 'session-replays',
    process.env.MINIO_BUCKET_DOCS || 'documents',
  ];

  for (const bucket of buckets) {
    try {
      const exists = await client.bucketExists(bucket);
      if (!exists) {
        await client.makeBucket(bucket);
        logger.info(`Created MinIO bucket: ${bucket}`);
      } else {
        logger.info(`MinIO bucket exists: ${bucket}`);
      }
    } catch (error) {
      logger.error(`Failed to create/check MinIO bucket ${bucket}:`, error);
      throw error;
    }
  }
}

export async function uploadFile(
  bucket: string,
  objectName: string,
  data: Buffer,
  metadata?: Record<string, string>
): Promise<string> {
  const client = getMinIOClient();
  await client.putObject(bucket, objectName, data, data.length, metadata);
  return objectName;
}

export async function getFile(bucket: string, objectName: string): Promise<Buffer> {
  const client = getMinIOClient();
  const stream = await client.getObject(bucket, objectName);
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

export async function deleteFile(bucket: string, objectName: string): Promise<void> {
  const client = getMinIOClient();
  await client.removeObject(bucket, objectName);
}

export default getMinIOClient;
