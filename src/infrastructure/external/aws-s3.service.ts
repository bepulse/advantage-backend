import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  size: number;
  etag: string;
}

export interface DownloadResult {
  stream: Readable;
  contentType?: string;
  contentLength?: number;
  lastModified?: Date;
}

export class AWSS3Service {
  private s3Client: S3Client;
  private bucket: string;
  private urlExpirationSeconds: number;

  constructor(
    private readonly region: string,
    private readonly accessKeyId: string,
    private readonly secretAccessKey: string,
    private readonly bucketName: string,
  ) {
    this.s3Client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });
    this.bucket = bucketName;
    this.urlExpirationSeconds = 3600; // 1 hour default
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata,
    });

    const result = await this.s3Client.send(command);

    return {
      key,
      url: `s3://${this.bucket}/${key}`,
      bucket: this.bucket,
      size: buffer.length,
      etag: result.ETag || '',
    };
  }

  /**
   * Download a file from S3
   */
  async downloadFile(key: string): Promise<DownloadResult> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const result = await this.s3Client.send(command);

    if (!result.Body) {
      throw new Error('File not found or empty');
    }

    return {
      stream: result.Body as Readable,
      contentType: result.ContentType,
      contentLength: result.ContentLength,
      lastModified: result.LastModified,
    };
  }

  /**
   * Generate a presigned URL for download (useful for frontend direct access)
   */
  async getPresignedDownloadUrl(key: string, expiresIn?: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresIn || this.urlExpirationSeconds,
    });
  }

  /**
   * Generate a presigned URL for upload (useful for frontend direct upload)
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn?: number
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresIn || this.urlExpirationSeconds,
    });
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Check if file exists and get metadata
   */
  async getFileMetadata(key: string): Promise<{
    exists: boolean;
    size?: number;
    lastModified?: Date;
    contentType?: string;
  }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const result = await this.s3Client.send(command);

      return {
        exists: true,
        size: result.ContentLength,
        lastModified: result.LastModified,
        contentType: result.ContentType,
      };
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return { exists: false };
      }
      throw error;
    }
  }

  /**
   * Generate a unique key for a document
   */
  generateDocumentKey(
    customerId: string,
    dependentId: string | null,
    documentKind: string,
    originalFileName: string
  ): string {
    const timestamp = Date.now();
    const extension = originalFileName.split('.').pop();
    const basePath = dependentId
      ? `customers/${customerId}/dependents/${dependentId}`
      : `customers/${customerId}`;

    return `${basePath}/${documentKind}/${timestamp}-${originalFileName}`;
  }
}