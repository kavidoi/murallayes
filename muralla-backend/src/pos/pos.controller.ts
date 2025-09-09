import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { PosSyncService } from './pos-sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('pos')
@UseGuards(JwtAuthGuard)
export class PosController {
  constructor(private readonly posSyncService: PosSyncService) {}

  // Manual sync endpoint (legacy)
  @Post('sync')
  async syncBranchReport(
    @Body() body: { fromDate?: string; toDate?: string }
  ) {
    const { fromDate, toDate } = body;
    
    const result = await this.posSyncService.syncBranchReportData(fromDate, toDate);
    
    return {
      success: result.success,
      message: result.message,
      data: {
        processedTransactions: result.processedTransactions,
        createdTransactions: result.createdTransactions,
        errors: result.errors
      }
    };
  }

  // Enhanced sync endpoint with advanced filtering and pagination
  @Post('sync-advanced')
  async syncBranchReportAdvanced(
    @Body() body: { 
      fromDate?: string; 
      toDate?: string;
      locationId?: string;
      serialNumber?: string;
      typeTransaction?: string;
      cardBrand?: string;
      maxPages?: number;
      pageSize?: number;
    }
  ) {
    const { fromDate, toDate, ...filters } = body;
    
    const result = await this.posSyncService.syncBranchReportDataPaginated(fromDate, toDate, filters);
    
    return {
      success: result.success,
      message: result.message,
      data: {
        processedTransactions: result.processedTransactions,
        createdTransactions: result.createdTransactions,
        errors: result.errors,
        pagination: {
          totalPages: result.totalPages,
          pagesProcessed: result.pagesProcessed
        }
      }
    };
  }

  // Get POS configuration
  @Public()
  @Get('configuration')
  async getConfiguration() {
    const config = await this.posSyncService.getPosConfiguration();

    // If no configuration exists yet, return a safe default object
    if (!config) {
      return {
        id: 'default',
        baseUrl: undefined,
        autoSyncEnabled: false,
        syncIntervalHours: 24,
        maxDaysToSync: 60,
        retentionDays: 365,
        hasApiKey: false,
      };
    }

    // Don't expose API key in response
    if (config.apiKey) {
      const { apiKey, ...safeConfig } = config as any;
      return {
        ...safeConfig,
        hasApiKey: !!config.apiKey,
      };
    }

    return { ...config, hasApiKey: false } as any;
  }

  // Update POS configuration
  @Post('configuration')
  async updateConfiguration(
    @Body() data: {
      apiKey?: string;
      baseUrl?: string;
      autoSyncEnabled?: boolean;
      syncIntervalHours?: number;
      maxDaysToSync?: number;
      retentionDays?: number;
    }
  ) {
    const updated = await this.posSyncService.updatePosConfiguration(data);
    
    // Don't expose API key in response
    if (updated?.apiKey) {
      const { apiKey, ...safeConfig } = updated;
      return {
        ...safeConfig,
        hasApiKey: !!apiKey
      };
    }
    
    return updated;
  }

  // Get sync history
  @Get('sync-history')
  async getSyncHistory(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.posSyncService.getSyncHistory(limitNum);
  }

  // Get POS transactions with filtering
  @Public()
  @Get('transactions')
  async getTransactions(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const filters = {
      startDate,
      endDate,
      status,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    return this.posSyncService.getPosTransactions(filters);
  }

  // Get transactions with advanced filtering
  @Get('transactions/advanced')
  async getTransactionsAdvanced(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('locationId') locationId?: string,
    @Query('serialNumber') serialNumber?: string,
    @Query('merchant') merchant?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const filters = {
      startDate,
      endDate,
      status,
      locationId,
      serialNumber,
      merchant,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    return this.posSyncService.getPosTransactionsAdvanced(filters);
  }

  // Get transactions by location
  @Get('transactions/location/:locationId')
  async getTransactionsByLocation(
    @Param('locationId') locationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const filters = {
      startDate,
      endDate,
      locationId,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    return this.posSyncService.getPosTransactionsAdvanced(filters);
  }

  // Get transactions by serial number (device)
  @Get('transactions/device/:serialNumber')
  async getTransactionsByDevice(
    @Param('serialNumber') serialNumber: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const filters = {
      startDate,
      endDate,
      serialNumber,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    return this.posSyncService.getPosTransactionsAdvanced(filters);
  }

  // Get transaction summary/analytics
  @Public()
  @Get('summary')
  async getTransactionSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const filters: any = {};
    
    if (startDate || endDate) {
      filters.transactionDateTime = {};
      if (startDate) {
        filters.transactionDateTime.gte = new Date(startDate + 'T00:00:00.000Z');
      }
      if (endDate) {
        filters.transactionDateTime.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // Get transaction counts and amounts by status
    const prismaAny = this.posSyncService['prisma'] as any;
    const [
      totalStats,
      completedStats,
      failedStats,
      pendingStats
    ] = await Promise.all([
      // Total transactions and amount
      prismaAny.pOSTransaction.aggregate({
        where: { ...filters },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),

      // Completed transactions (aligned with enum)
      prismaAny.pOSTransaction.aggregate({
        where: { status: 'COMPLETED', ...filters },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),

      // Failed transactions
      prismaAny.pOSTransaction.aggregate({
        where: { status: 'FAILED', ...filters },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),

      // Pending transactions
      prismaAny.pOSTransaction.aggregate({
        where: { status: 'PENDING', ...filters },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalTransactions: totalStats._count.id || 0,
      totalAmount: totalStats._sum.totalAmount || 0,
      successfulTransactions: completedStats._count.id || 0,
      successfulAmount: completedStats._sum.totalAmount || 0,
      failedTransactions: failedStats._count.id || 0,
      failedAmount: failedStats._sum.totalAmount || 0,
      pendingTransactions: pendingStats._count.id || 0,
      pendingAmount: pendingStats._sum.totalAmount || 0,
      successRate: totalStats._count.id > 0
        ? Math.round(((completedStats._count.id || 0) / totalStats._count.id) * 100)
        : 0,
      dailyBreakdown: [] // TODO: implement safe, parameterized daily breakdown
    };
  }

  // Test database insertion endpoint
  @Post('test-db')
  async testDatabaseInsertion() {
    return this.posSyncService.testDatabaseInsertion();
  }

  // Health check endpoint
  @Public()
  @Get('health')
  async getHealth() {
    const config = await this.posSyncService.getPosConfiguration();
    const recentSyncs = await this.posSyncService.getSyncHistory(5);
    
    const lastSync = recentSyncs[0];
    const lastSuccessfulSync = recentSyncs.find(sync => sync.status === 'COMPLETED');
    
    return {
      configured: !!config?.apiKey,
      enabled: config?.autoSyncEnabled || false,
      lastSyncAt: lastSync?.startedAt || null,
      lastSyncStatus: lastSync?.status || null,
      lastSuccessfulSyncAt: lastSuccessfulSync?.startedAt || null,
      totalSyncs: recentSyncs.length,
      recentSyncs: recentSyncs.map(sync => ({
        id: sync.id,
        status: sync.status,
        startTime: sync.startedAt,
        endTime: sync.completedAt,
        processedTransactions: sync.totalProcessed,
        createdTransactions: sync.totalCreated,
        hasErrors: (sync.errorDetails ? true : false)
      }))
    };
  }
}