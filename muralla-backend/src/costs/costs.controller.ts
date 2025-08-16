import { Body, Controller, Get, Param, Post, Query, UseGuards, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { CostsService } from './costs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import type {} from '../prisma-v6-compat';
import { CreateCostDto } from './dto/create-cost.dto';
import { ListCostsQueryDto } from './dto/list-costs.dto';
import { LinkTransactionDto } from './dto/link-transaction.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'staff')
@Controller('costs')
export class CostsController {
  constructor(private readonly costs: CostsService) {}

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

  // Simple upload endpoint for receipts (mobile-friendly)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dest = join(process.cwd(), 'uploads', 'receipts');
          if (!existsSync(dest)) {
            mkdirSync(dest, { recursive: true });
          }
          cb(null, dest);
        },
        filename: (_req, file, cb) => {
          const ts = Date.now();
          const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
          cb(null, `${ts}-${safeName}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    })
  )
  uploadReceipt(@Req() req: any, @UploadedFile() file: any) {
    if (!file) {
      return { error: 'No file uploaded' };
    }
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    return {
      fileUrl: `${baseUrl}/uploads/receipts/${file.filename}`,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
    };
  }
}
