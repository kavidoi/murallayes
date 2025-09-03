import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StorageService, UploadOptions } from './storage.service';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * Upload product image to Cloudinary
   */
  @Post('images/products')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    })
  )
  async uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { productId?: string; transformation?: string }
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const options: UploadOptions = {
      folder: 'products',
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    };

    if (body.transformation) {
      try {
        options.transformation = JSON.parse(body.transformation);
      } catch (e) {
        // Ignore invalid transformation
      }
    }

    const result = await this.storageService.uploadImage(
      file.buffer,
      file.originalname,
      options
    );

    return {
      success: true,
      data: result,
      message: 'Product image uploaded successfully',
    };
  }

  /**
   * Upload brand image to Cloudinary
   */
  @Post('images/brands')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    })
  )
  async uploadBrandImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { brandId?: string }
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const options: UploadOptions = {
      folder: 'brands',
      maxSize: 5 * 1024 * 1024,
      transformation: {
        width: 400,
        height: 400,
        crop: 'fill',
        quality: 'auto:good',
      },
    };

    const result = await this.storageService.uploadImage(
      file.buffer,
      file.originalname,
      options
    );

    return {
      success: true,
      data: result,
      message: 'Brand image uploaded successfully',
    };
  }

  /**
   * Upload receipt/document to S3
   */
  @Post('documents/receipts')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/tiff',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Only PDF and image files are allowed'),
            false
          );
        }
        cb(null, true);
      },
    })
  )
  async uploadReceipt(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const options: UploadOptions = {
      folder: 'receipts',
      maxSize: 10 * 1024 * 1024,
    };

    const result = await this.storageService.uploadDocument(
      file.buffer,
      file.originalname,
      file.mimetype,
      options
    );

    return {
      success: true,
      data: {
        ...result,
        uploadedBy: req.user?.userId,
      },
      message: 'Receipt uploaded successfully',
    };
  }

  /**
   * Upload general document to S3
   */
  @Post('documents/general')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    })
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { folder?: string },
    @Req() req: any
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const options: UploadOptions = {
      folder: body.folder || 'documents',
      maxSize: 10 * 1024 * 1024,
    };

    const result = await this.storageService.uploadDocument(
      file.buffer,
      file.originalname,
      file.mimetype,
      options
    );

    return {
      success: true,
      data: {
        ...result,
        uploadedBy: req.user?.userId,
      },
      message: 'Document uploaded successfully',
    };
  }

  /**
   * Delete image from Cloudinary
   */
  @Delete('images/:publicId')
  async deleteImage(@Param('publicId') publicId: string) {
    // URL decode the publicId (it may contain slashes)
    const decodedPublicId = decodeURIComponent(publicId);
    
    await this.storageService.deleteImage(decodedPublicId);

    return {
      success: true,
      message: 'Image deleted successfully',
    };
  }

  /**
   * Delete document from S3
   */
  @Delete('documents/:key')
  async deleteDocument(@Param('key') key: string) {
    try {
      await this.storageService.deleteDocument(key);
      return { message: 'Document deleted successfully' };
    } catch (error) {
      throw new BadRequestException(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * Get optimized image URL
   */
  @Post('images/optimize')
  getOptimizedImageUrl(
    @Body()
    body: {
      publicId: string;
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    }
  ) {
    const { publicId, ...options } = body;
    
    const optimizedUrl = this.storageService.getOptimizedImageUrl(
      publicId,
      options
    );

    return {
      success: true,
      data: { optimizedUrl },
      message: 'Optimized URL generated successfully',
    };
  }

  /**
   * Get secure document URL
   */
  @Get('documents/presigned-url')
  async getPresignedUrl(
    @Query('key') key: string,
    @Query('contentType') contentType: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    try {
      const expires = expiresIn ? parseInt(expiresIn) : 3600;
      const url = await this.storageService.generatePresignedUrl(
        key,
        contentType,
        expires,
      );
      return { presignedUrl: url, expiresIn: expires };
    } catch (error) {
      throw new BadRequestException(`Failed to generate presigned URL: ${error.message}`);
    }
  }
}
