import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function toDecimal(v: any): Prisma.Decimal | null {
  if (v === null || v === undefined) return null;
  try {
    return new Prisma.Decimal(v as any);
  } catch {
    return new Prisma.Decimal(String(v));
  }
}

@Injectable()
export class CostsService {
  constructor(private prisma: PrismaService) {}

  async createCost(dto: any) {
    if (!dto?.companyId) throw new BadRequestException('companyId is required');
    if (!dto?.categoryId) throw new BadRequestException('categoryId is required');
    if (!dto?.docType) throw new BadRequestException('docType is required');
    if (!dto?.date) throw new BadRequestException('date is required');
    if (dto?.total === undefined || dto?.total === null)
      throw new BadRequestException('total is required');

    const attachments = Array.isArray(dto.attachments) ? dto.attachments : [];
    const lines = Array.isArray(dto.lines) ? dto.lines : [];

    const created = await this.prisma.cost.create({
      data: {
        companyId: dto.companyId,
        categoryId: dto.categoryId,
        vendorId: dto.vendorId ?? null,
        docType: dto.docType,
        docNumber: dto.docNumber ?? null,
        date: new Date(dto.date),
        total: toDecimal(dto.total)!,
        currency: dto.currency ?? 'CLP',
        payerType: dto.payerType ?? 'COMPANY',
        payerCompanyId: dto.payerCompanyId ?? null,
        staffId: dto.staffId ?? null,
        bankAccountId: dto.bankAccountId ?? null,
        description: dto.description ?? null,
        // Only set status if valid; otherwise let Prisma default (PENDING)
        status: ['PENDING','APPROVED','PAID','CANCELLED'].includes(dto.status) ? dto.status : undefined,
        createdBy: dto.createdBy ?? null,
        attachments: attachments.length
          ? {
              create: attachments.map((a: any) => ({
                fileName: a.fileName ?? null,
                fileUrl: a.fileUrl,
                fileType: a.fileType ?? 'application/octet-stream',
                fileSize: a.fileSize ?? null,
                ocrData: a.ocrData ?? a.ocrJson ?? null,
                uploadedBy: a.uploadedBy ?? null,
              })),
            }
          : undefined,
        lines: lines.length
          ? {
              create: lines.map((l: any) => {
                const quantity = l.qty !== undefined && l.qty !== null ? toDecimal(l.qty) : null;
                const unitCost = l.unitCost !== undefined && l.unitCost !== null ? toDecimal(l.unitCost) : null;
                const totalCost = quantity && unitCost ? (quantity as any).mul ? (quantity as any).mul(unitCost as any) : toDecimal(Number(quantity) * Number(unitCost)) : toDecimal(0);
                return {
                  productId: l.productId ?? null,
                  isInventory: !!l.isInventory,
                  quantity,
                  unitCost,
                  totalCost: totalCost!,
                  locationId: l.locationId ?? null,
                  description: l.notes ?? l.description ?? null,
                };
              }),
            }
          : undefined,
      },
      include: { lines: true, attachments: true },
    });
    
    return created;
  }

  async listCosts(params: {
    companyId?: string;
    vendorId?: string;
    categoryId?: string;
    dateFrom?: string;
    dateTo?: string;
    take?: number;
    skip?: number;
  }) {
    const where: any = {};
    if (params.companyId) where.companyId = params.companyId;
    if (params.vendorId) where.vendorId = params.vendorId;
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.dateFrom || params.dateTo) {
      where.date = {};
      if (params.dateFrom) (where.date as any).gte = new Date(params.dateFrom);
      if (params.dateTo) (where.date as any).lte = new Date(params.dateTo);
    }

    return this.prisma.cost.findMany({
      where,
      include: {
        lines: true,
        attachments: true,
        vendor: true,
        category: true,
        company: true,
      },
      orderBy: { date: 'desc' },
      take: params.take ? Number(params.take) : 50,
      skip: params.skip ? Number(params.skip) : 0,
    });
  }

  async getCost(id: string) {
    const cost = await this.prisma.cost.findUnique({
      where: { id },
      include: {
        lines: true,
        attachments: true,
        vendor: true,
        category: true,
        company: true,
        links: true,
      },
    });
    if (!cost) throw new BadRequestException('Cost not found');
    return cost;
  }

  async linkTransaction(costId: string, transactionId: string) {
    // TODO: Enable after database migration is complete
    // try {
    //   return await this.prisma.costTransactionLink.create({
    //     data: { costId, transactionId },
    //   });
    // } catch (e) {
    //   if ((e as any)?.code === 'P2002') {
    //     // Duplicate
    //     return { costId, transactionId };
    //   }
    throw new Error('Cost transaction linking will be available after database migration');
  }
}
