import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as path from 'path';
import * as crypto from 'crypto';

export interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  publicId?: string; // For Cloudinary
  key?: string; // For S3
}

export interface UploadOptions {
  folder?: string;
  transformation?: any; // Cloudinary transformations
  maxSize?: number; // Max file size in bytes
  allowedTypes?: string[]; // Allowed MIME types
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    // Initialize Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME', 'daqkotj1t'),
      api_key: this.configService.get('CLOUDINARY_API_KEY', '839819221611429'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET', 'Lbrmb6nc2CHccJYsjJqTc-hjE3I'),
    });

    // Initialize AWS S3
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
    
    this.bucketName = this.configService.get('AWS_S3_BUCKET_NAME', 'muralla-files');
  }

  /**
   * Upload image to Cloudinary (optimized for product images)
   */
  async uploadImage(
    buffer: Buffer,
    fileName: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const { folder = 'products', transformation, maxSize = 5 * 1024 * 1024 } = options;

      if (buffer.length > maxSize) {
        throw new Error(`File size exceeds limit of ${maxSize} bytes`);
      }

      // Generate unique filename
      const ext = path.extname(fileName);
      const name = path.basename(fileName, ext);
      const uniqueName = `${name}_${crypto.randomUUID()}`;

      const uploadOptions: any = {
        folder,
        public_id: uniqueName,
        resource_type: 'auto',
        quality: 'auto:good',
        fetch_format: 'auto',
      };

      if (transformation) {
        uploadOptions.transformation = transformation;
      }

      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      this.logger.log(`Image uploaded to Cloudinary: ${result.secure_url}`);

      return {
        fileUrl: result.secure_url,
        fileName,
        fileType: result.format,
        fileSize: result.bytes,
        publicId: result.public_id,
      };
    } catch (error) {
      this.logger.error(`Failed to upload image to Cloudinary: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload document to AWS S3 (for receipts, PDFs, etc.)
   */
  async uploadDocument(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const { folder = 'documents', maxSize = 10 * 1024 * 1024 } = options;

      if (buffer.length > maxSize) {
        throw new Error(`File size exceeds limit of ${maxSize} bytes`);
      }

      // Generate unique key
      const ext = path.extname(fileName);
      const name = path.basename(fileName, ext);
      const key = `${folder}/${name}_${crypto.randomUUID()}${ext}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256',
        Metadata: {
          originalName: fileName,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      const fileUrl = `https://${this.bucketName}.s3.amazonaws.com/${key}`;
      
      this.logger.log(`Document uploaded to S3: ${fileUrl}`);

      return {
        fileUrl,
        fileName,
        fileType: mimeType,
        fileSize: buffer.length,
        key,
      };
    } catch (error) {
      this.logger.error(`Failed to upload document to S3: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Image deleted from Cloudinary: ${publicId}`);
    } catch (error) {
      this.logger.error(`Failed to delete image from Cloudinary: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete document from S3
   */
  async deleteDocument(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`Document deleted from S3: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete document from S3: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate presigned URL for direct upload (optional advanced feature)
   */
  async generatePresignedUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get optimized image URL with transformations
   */
  getOptimizedImageUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    } = {}
  ): string {
    const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = options;

    let transformation = `q_${quality},f_${format}`;
    
    if (width || height) {
      transformation += `,c_${crop}`;
      if (width) transformation += `,w_${width}`;
      if (height) transformation += `,h_${height}`;
    }

    return cloudinary.url(publicId, {
      transformation,
      secure: true,
    });
  }
}
