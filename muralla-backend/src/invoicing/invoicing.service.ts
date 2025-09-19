import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicingService {
  constructor(private prisma: PrismaService) {}

  async getTaxDocuments(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      this.prisma.taxDocument.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
      this.prisma.taxDocument.count(),
    ]);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTaxDocumentById(id: string) {
    return this.prisma.taxDocument.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
  }

  async getTaxDocumentStats() {
    const [total, byStatus, byType, recentTotal] = await Promise.all([
      this.prisma.taxDocument.count(),
      this.prisma.taxDocument.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.taxDocument.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      this.prisma.taxDocument.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    const totalAmount = await this.prisma.taxDocument.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'ISSUED' },
    });

    return {
      total,
      totalAmount: totalAmount._sum.totalAmount || 0,
      recentTotal,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {}),
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {}),
    };
  }
}