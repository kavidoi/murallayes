import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CostsService } from './costs.service';
import { CreateCostDto } from './dto/create-cost.dto';
// import { UpdateCostDto } from './dto/update-cost.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { LinkTransactionDto } from './dto/link-transaction.dto';
import { ListCostsQueryDto } from './dto/list-costs.dto';
import type {} from '../prisma-v6-compat';
import { diskStorage } from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'staff')
@Controller('costs')
export class CostsController {
  constructor(
    private readonly costs: CostsService,
    private readonly storageService: StorageService
  ) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateCostDto) {
    const userId = req?.user?.userId;
    // Inject creator and default uploader
    (dto as any).createdBy = userId;
    if (Array.isArray((dto as any).attachments)) {
      (dto as any).attachments = (dto as any).attachments.map((a: any) => ({
        uploadedBy: a.uploadedBy ?? userId,
        ...a,
      }));
    }
    return this.costs.createCost(dto as any);
  }

  @Get()
  list(@Query() q: ListCostsQueryDto) {
    return this.costs.listCosts(q);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.costs.getCost(id);
  }

  @Post(':id/link-transaction')
  link(@Param('id') costId: string, @Body() dto: LinkTransactionDto) {
    return this.costs.linkTransaction(costId, dto.transactionId);
  }

  // Upload receipt using cloud storage
  @Post('upload')
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
  async uploadReceipt(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.storageService.uploadDocument(
        file.buffer,
        file.originalname,
        file.mimetype,
        { folder: 'receipts' }
      );

      return {
        success: true,
        data: {
          ...result,
          uploadedBy: req.user?.userId,
        },
        message: 'Receipt uploaded successfully',
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }
}
