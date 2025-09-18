import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios, { AxiosInstance } from 'axios';

// Tuu BranchReport API Types
interface TuuBranchReportRequest {
  from: string; // Format: "2025-09-05"
  to: string;   // Format: "2025-09-05"
  page?: number; // Pagination - minimum 1
  pageSize?: number; // Pagination - maximum 20
  locationId?: string; // Filter by specific location
  serialNumber?: string; // Filter by specific POS device
  typeTransaction?: string; // Filter by transaction type
  cardBrand?: string; // Filter by card brand (available after May 1, 2025)
}

// Tuu Report Generation API Types (secondary API)
interface TuuReportRequest {
  Filters: {
    StartDate: string; // Format: "2024-01-01"
    EndDate: string;   // Format: "2024-01-31"
    SerialNumber?: string; // Optional POS device serial
  };
  page?: number; // Default 1
  pageSize?: number; // Default 10, max 20
}

interface TuuBranchReportResponse {
  message: string;
  data: TuuBranchReportData[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    pageSize: number;
  };
}

// Tuu Report Generation API Response Types
interface TuuReportResponse {
  message: string;
  data: {
    commerce: {
      id: string;
      name: string;
    };
    transactions: TuuReportTransaction[];
  };
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
}

interface TuuReportTransaction {
  id: string;
  amount: number;
  type: string;
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
  dateTime: string;
  serialNumber: string;
}

interface TuuBranchReportData {
  id: string;
  merchant: string;
  date: string;
  location: {
    id: string;
    address: string;
  };
  sales: TuuBranchSale[];
}

interface TuuBranchSale {
  id: string;
  sequenceNumber?: string;
  serialNumber?: string;
  status: "SUCCESSFUL" | "FAILED" | "PENDING";
  transactionDateTime: string;
  transactionType: string;
  saleAmount: number;
  totalAmount: number;
  items?: TuuBranchSaleItem[];
}

interface TuuBranchSaleItem {
  code?: string;
  name: string;
  quantity: number;
  price: number;
}

@Injectable()
export class PosSyncService implements OnModuleInit {
  private readonly logger = new Logger(PosSyncService.name);
  private api: AxiosInstance;
  private isEnabled: boolean = false;
  private apiKey: string;
  private baseUrl: string;

  constructor(private prisma: PrismaService) {
    // Initialization will happen in onModuleInit
  }

  async onModuleInit() {
    // Initialize after all modules are loaded and dependencies are injected
    try {
      await this.initializeApi();
    } catch (error) {
      this.logger.error('Failed to initialize POS service:', error);
      // Don't throw - allow the service to start without POS functionality
    }
  }

  private async initializeApi() {
    try {
      // Ensure PrismaService is available before proceeding
      if (!this.prisma) {
        this.logger.error('PrismaService not available during initialization');
        return;
      }

      // Get POS configuration from database
      const config = await this.getPosConfiguration();

      if (config) {
        this.apiKey = config.apiKey || process.env.TUU_API_KEY;
        this.baseUrl = config.baseUrl || 'https://integrations.payment.haulmer.com';
        this.isEnabled = config.autoSyncEnabled && !!this.apiKey;
      } else {
        // Create default configuration
        try {
          await this.createDefaultConfiguration();
        } catch (error) {
          this.logger.error('Failed to create default configuration:', error);
        }
      }

      if (this.apiKey) {
        this.api = axios.create({
          baseURL: this.baseUrl,
          headers: {
            // Support both header styles used by Tuu variants
            'X-API-Key': this.apiKey,
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        });

        // Add request/response interceptors for logging
        this.api.interceptors.request.use(
          (config) => {
            this.logger.log(`Tuu API Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
          },
          (error) => {
            this.logger.error('Tuu API Request Error:', error.message);
            return Promise.reject(error);
          }
        );

        this.api.interceptors.response.use(
          (response) => {
            this.logger.log(`Tuu API Response: ${response.status} - ${response.data?.message || 'Success'}`);
            return response;
          },
          (error) => {
            this.logger.error('Tuu API Response Error:', {
              status: error.response?.status,
              data: error.response?.data,
              message: error.message,
            });
            return Promise.reject(error);
          }
        );
      }
    } catch (error) {
      this.logger.error('Failed to initialize POS API:', error);
    }
  }

  private async createDefaultConfiguration() {
    try {
      await this.prisma.pOSConfiguration.create({
        data: {
          apiKey: process.env.TUU_API_KEY,
          baseUrl: 'https://integrations.payment.haulmer.com',
          autoSyncEnabled: true,
          syncIntervalHours: 24, // Daily sync
          maxDaysToSync: 60,     // 60-day retention
          retentionDays: 365,    // Keep data for 1 year
          tenantId: null,
        }
      });
      this.logger.log('Created default POS configuration');
    } catch (error) {
      this.logger.error('Failed to create default POS configuration:', error);
      this.logger.warn('POS configuration table may not exist. Check if migrations were applied.');
      // Don't throw - allow the service to continue without configuration
    }
  }

  // Manual sync method - can be called on-demand
  async syncBranchReportData(fromDate?: string, toDate?: string): Promise<{
    success: boolean;
    message: string;
    processedTransactions: number;
    createdTransactions: number;
    errors: string[];
  }> {
    const syncId = `sync_${Date.now()}`;
    const startTime = new Date();
    const errors: string[] = [];
    let processedTransactions = 0;
    let createdTransactions = 0;

    try {
      if (!this.isEnabled) {
        const message = 'POS sync is disabled or not configured properly';
        this.logger.warn(message);
        return {
          success: false,
          message,
          processedTransactions: 0,
          createdTransactions: 0,
          errors: [message]
        };
      }

      // Default date range: last 7 days to today
      const endDate = (toDate && toDate.match(/^\d{4}-\d{2}-\d{2}$/)) ? toDate : new Date().toISOString().split('T')[0];
      const startDate = (fromDate && fromDate.match(/^\d{4}-\d{2}-\d{2}$/)) ? fromDate : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      // Ensure startDate <= endDate
      const startMs = Date.parse(startDate);
      const endMs = Date.parse(endDate);
      const baseRange = startMs > endMs ? { from: endDate, to: startDate } : { from: startDate, to: endDate };

      this.logger.log(`Starting POS sync for date range: ${baseRange.from} to ${baseRange.to}`);

      // Create sync log entry
      const prismaAny = this.prisma as any;
      const syncLog = await prismaAny.pOSSyncLog.create({
        data: {
          syncType: 'MANUAL',
          status: 'RUNNING',
          startDate: new Date(startDate + 'T00:00:00.000Z'),
          endDate: new Date(endDate + 'T23:59:59.999Z'),
          startedAt: new Date(),
          apiEndpoint: '/BranchReport/branch-report',
          tenantId: null
        }
      });

      try {
        // Tuu requires ranges <= 30 days; chunk the requested period
        const chunks = this.chunkDateRange(baseRange.from, baseRange.to, 30);
        let lastBranchReportResponse: TuuBranchReportResponse | null = null;
        let anyData = false;
        for (const chunk of chunks) {
          // Fetch data from Tuu BranchReport API per chunk
          const branchReportResponse = await this.getBranchReportData({
            from: chunk.from,
            to: chunk.to
          });
          lastBranchReportResponse = branchReportResponse;

          const branches = this.extractBranchData(branchReportResponse);
          if (!branches.length) {
            this.logger.warn(`No data received from Tuu API for range ${chunk.from} to ${chunk.to}`);
            continue;
          }
          anyData = true;

          // Debug: Log raw API response structure
          this.logger.debug('Raw API Response structure:', {
            hasData: !!branchReportResponse,
            dataKeys: branchReportResponse ? Object.keys(branchReportResponse) : [],
            branchCount: branches.length,
            firstBranch: branches[0] ? {
              keys: Object.keys(branches[0]),
              location: (branches[0] as any).location,
              merchant: (branches[0] as any).merchant,
              salesCount: Array.isArray((branches[0] as any).sales) ? (branches[0] as any).sales.length : 0
            } : null
          });
          
          // Debug: Log the full API response for analysis
          this.logger.debug('Full API Response (first 500 chars):', JSON.stringify(branchReportResponse).substring(0, 500));

          // Process each branch's data
          for (const branchData of branches) {
            const sales = Array.isArray((branchData as any).sales) ? (branchData as any).sales : [];

            // Debug: Log sales data structure
            if (sales.length > 0) {
              this.logger.debug('First sale structure:', {
                saleKeys: Object.keys(sales[0]),
                saleData: {
                  id: sales[0].id,
                  status: sales[0].status,
                  transactionDateTime: sales[0].transactionDateTime,
                  transactionType: sales[0].transactionType,
                  saleAmount: sales[0].saleAmount,
                  totalAmount: sales[0].totalAmount,
                  sequenceNumber: sales[0].sequenceNumber,
                  serialNumber: sales[0].serialNumber,
                  itemsCount: sales[0].items ? sales[0].items.length : 0
                }
              });
            }

            for (const sale of sales) {
              try {
                processedTransactions++;

                // Generate ID if missing - use multiple fallback strategies
                let transactionId = sale.id;
                if (!transactionId || transactionId === undefined || transactionId === null || transactionId === '') {
                  // Try different ID fields that might exist
                  transactionId = sale.transactionId || sale.saleId || sale.tuuSaleId;

                  // If still no ID, generate one using available data
                  if (!transactionId) {
                    const timestamp = sale.transactionDateTime || new Date().toISOString();
                    const serial = sale.serialNumber || 'unknown';
                    const amount = sale.totalAmount || sale.saleAmount || 0;
                    const sequence = sale.sequenceNumber || Math.floor(Math.random() * 10000);
                    transactionId = `${serial}-${timestamp.replace(/[^0-9]/g, '').slice(0, 14)}-${amount}-${sequence}`;
                    this.logger.warn(`Generated fallback ID for transaction: ${transactionId}`);
                  }
                }

                // Debug: Log the sale ID validation
                this.logger.debug(`Using transaction ID: ${transactionId} (original: ${sale.id}, type: ${typeof transactionId})`);

                // Final validation - ensure we have a valid ID
                if (!transactionId || transactionId === undefined || transactionId === null || transactionId === '') {
                  const errorMsg = `Skipping transaction - unable to generate valid ID. Sale data: ${JSON.stringify(sale, null, 2)}`;
                  errors.push(errorMsg);
                  this.logger.error(errorMsg);
                  continue;
                }

                if (!sale.transactionDateTime) {
                  const errorMsg = `Skipping transaction ${transactionId} with missing transactionDateTime`;
                  errors.push(errorMsg);
                  this.logger.warn(errorMsg);
                  continue;
                }

                if (!sale.saleAmount && sale.saleAmount !== 0) {
                  const errorMsg = `Skipping transaction ${transactionId} with missing saleAmount`;
                  errors.push(errorMsg);
                  this.logger.warn(errorMsg);
                  continue;
                }

                if (!sale.totalAmount && sale.totalAmount !== 0) {
                  const errorMsg = `Skipping transaction ${transactionId} with missing totalAmount`;
                  errors.push(errorMsg);
                  this.logger.warn(errorMsg);
                  continue;
                }

                if (!sale.transactionType) {
                  const errorMsg = `Skipping transaction ${transactionId} with missing transactionType`;
                  errors.push(errorMsg);
                  this.logger.warn(errorMsg);
                  continue;
                }

                // Check if transaction already exists using the generated/validated ID
                const existingTransaction = await this.prisma.pOSTransaction.findUnique({
                  where: { tuuSaleId: transactionId }
                });

                if (!existingTransaction) {
                  // Debug: Log data being saved
                  const mappedStatus = this.mapTuuStatusToPrisma(sale.status);
                  const transactionData = {
                    tuuSaleId: transactionId,
                    sequenceNumber: sale.sequenceNumber || null,
                    serialNumber: sale.serialNumber || null,
                    locationId: branchData.location?.id || null,
                    address: branchData.location?.address || null,
                    status: mappedStatus,
                    transactionDateTime: new Date(sale.transactionDateTime),
                    transactionType: sale.transactionType,
                    saleAmount: parseFloat(sale.saleAmount?.toString() || '0'),
                    totalAmount: parseFloat(sale.totalAmount?.toString() || '0'),
                    tenantId: null,
                  };

                  this.logger.debug('Creating transaction with data:', {
                    tuuSaleId: transactionData.tuuSaleId,
                    originalSaleId: sale.id,
                    status: transactionData.status,
                    originalStatus: sale.status,
                    transactionDateTime: transactionData.transactionDateTime,
                    transactionType: transactionData.transactionType,
                    saleAmount: transactionData.saleAmount,
                    totalAmount: transactionData.totalAmount,
                    locationId: transactionData.locationId,
                    address: transactionData.address,
                    merchant: branchData.merchant
                  });

                  // Create new transaction with items
                  await this.prisma.pOSTransaction.create({
                    data: {
                      tuuSaleId: transactionData.tuuSaleId,
                      sequenceNumber: transactionData.sequenceNumber,
                      serialNumber: transactionData.serialNumber,
                      locationId: transactionData.locationId,
                      address: transactionData.address,
                      status: transactionData.status,
                      transactionDateTime: transactionData.transactionDateTime,
                      transactionType: transactionData.transactionType,
                      saleAmount: transactionData.saleAmount,
                      totalAmount: transactionData.totalAmount,
                      tenantId: transactionData.tenantId,
                      items: {
                        create: sale.items?.map(item => ({
                          code: item.code,
                          name: item.name,
                          quantity: item.quantity,
                          price: item.price,
                          tenantId: null,
                        })) || []
                      },
                      syncLogs: {
                        connect: { id: syncLog.id }
                      }
                    },
                    include: {
                      items: true
                    }
                  });

                  createdTransactions++;
                  this.logger.debug(`Created transaction: ${transactionId} (original: ${sale.id})`);
                } else {
                  this.logger.debug(`Transaction already exists: ${transactionId} (original: ${sale.id})`);
                }
              } catch (error) {
                const usedId = transactionId || sale.id || 'unknown';
                const errorMsg = `Failed to process transaction ${usedId}: ${error.message}`;
                errors.push(errorMsg);

                // Enhanced error logging
                this.logger.error('Full Prisma error:', {
                  message: error.message,
                  code: error.code,
                  meta: error.meta,
                  stack: error.stack?.split('\n').slice(0, 5) // First 5 lines of stack
                });

                this.logger.error('Transaction data that failed:', {
                  generatedTuuSaleId: transactionId,
                  originalSaleId: sale.id,
                  status: sale.status,
                  mappedStatus: this.mapTuuStatusToPrisma(sale.status),
                  transactionDateTime: sale.transactionDateTime,
                  parsedDateTime: new Date(sale.transactionDateTime),
                  transactionType: sale.transactionType,
                  saleAmount: sale.saleAmount,
                  saleAmountType: typeof sale.saleAmount,
                  totalAmount: sale.totalAmount,
                  totalAmountType: typeof sale.totalAmount,
                  locationId: branchData.location?.id,
                  merchant: branchData.merchant
                });
              }
            }
          }
        }

        if (!anyData) {
          // Update sync log with completed but no data
          await this.prisma.pOSSyncLog.update({
            where: { id: syncLog.id },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              totalProcessed: 0,
              totalCreated: 0,
              totalErrors: 0,
              errorDetails: null
            }
          });
          return {
            success: true,
            message: 'No transactions for selected range',
            processedTransactions: 0,
            createdTransactions: 0,
            errors
          };
        }

        // Update sync log with success
        const prismaAny3 = this.prisma as any;
        await prismaAny3.pOSSyncLog.update({
          where: { id: syncLog.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            totalProcessed: processedTransactions,
            totalCreated: createdTransactions,
            totalErrors: errors.length,
            errorDetails: errors.length > 0 ? { errors } : null,
            responseData: lastBranchReportResponse
          }
        });

        const message = `Sync completed successfully. Processed: ${processedTransactions}, Created: ${createdTransactions}`;
        this.logger.log(message);

        return {
          success: true,
          message,
          processedTransactions,
          createdTransactions,
          errors
        };

      } catch (error) {
        // Create sync log
        const syncLog = await this.prisma.pOSSyncLog.create({
          data: {
            syncType: 'MANUAL',
            status: 'FAILED',
            startDate: new Date(),
            endDate: new Date(),
            startedAt: new Date(),
            apiEndpoint: '/BranchReport/branch-report',
            tenantId: null
          }
        });

        await this.prisma.pOSSyncLog.update({
          where: { id: syncLog.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            totalProcessed: processedTransactions,
            totalCreated: createdTransactions,
            totalErrors: errors.length,
            errorDetails: errors.length > 0 ? { errors } : null,
            errorMessage: error.message,
          }
        });

        throw error;
      }

    } catch (error) {
      const message = `POS sync failed: ${error.message}`;
      this.logger.error(message, error);
      
      return {
        success: false,
        message,
        processedTransactions,
        createdTransactions,
        errors: [...errors, error.message]
      };
    }
  }

  // Scheduled automatic sync - runs daily at 2 AM
  @Cron('0 2 * * *', {
    name: 'pos-daily-sync',
    timeZone: 'America/Santiago', // Chile timezone
  })
  async scheduledSync() {
    if (!this.isEnabled) {
      this.logger.log('Scheduled POS sync skipped - disabled');
      return;
    }

    this.logger.log('Starting scheduled POS sync');
    
    // Get configuration for sync parameters
    const config = await this.prisma.pOSConfiguration.findFirst({});

    if (!config?.autoSyncEnabled) {
      this.logger.log('Scheduled POS sync skipped - auto sync disabled');
      return;
    }

    // Sync last N days based on configuration
    const daysToSync = config.maxDaysToSync || 60;
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - daysToSync * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await this.syncBranchReportData(startDate, endDate);
    
    if (result.success) {
      this.logger.log(`Scheduled sync completed: ${result.message}`);
    } else {
      this.logger.error(`Scheduled sync failed: ${result.message}`);
    }

    // Clean up old data based on retention policy
    await this.cleanupOldData();
  }

  private async getBranchReportData(request: TuuBranchReportRequest): Promise<TuuBranchReportResponse> {
    if (!this.api) {
      throw new Error('Tuu API not initialized');
    }

    try {
      // Ensure required pagination parameters are always present
      // Some Tuu deployments expect startDate/endDate instead of from/to.
      // Send both shapes to be compatible.
      const payload: any = {
        page: request.page ?? 1,
        pageSize: request.pageSize ?? 20,
        // original keys
        from: (request as any).from,
        to: (request as any).to,
        // alternate keys expected by some variants
        startDate: (request as any).from,
        endDate: (request as any).to,
        locationId: (request as any).locationId,
        serialNumber: (request as any).serialNumber,
        typeTransaction: (request as any).typeTransaction,
        cardBrand: (request as any).cardBrand,
      };
      this.logger.debug(`Calling Tuu BranchReport with payload: ${JSON.stringify(payload)}`);
      const response = await this.api.post('/BranchReport/branch-report', payload);
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const respData = error.response?.data;
      const inferredMsg = (respData && (respData.message || respData.error))
        || (typeof respData === 'string' ? respData : '')
        || error.message;
      const details = respData ? JSON.stringify(respData).slice(0, 800) : '';
      if (status === 401) {
        throw new Error('Invalid API key for Tuu service');
      } else if (status && status >= 500) {
        throw new Error('Tuu service is temporarily unavailable');
      } else {
        throw new Error(`Tuu API error (${status || 'unknown'}): ${inferredMsg}${details ? ` | details=${details}` : ''}`);
      }
    }
  }

  // New method for Report Generation API (secondary API)
  private async getReportData(request: TuuReportRequest): Promise<TuuReportResponse> {
    if (!this.api) {
      throw new Error('Tuu API not initialized');
    }

    try {
      const response = await this.api.post('/Report/get-report', request);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Invalid API key for Tuu service');
      } else if (error.response?.status >= 500) {
        throw new Error('Tuu service is temporarily unavailable');
      } else {
        throw new Error(`Tuu Report API error: ${error.message}`);
      }
    }
  }

  // Enhanced sync method with pagination support
  async syncBranchReportDataPaginated(
    fromDate?: string,
    toDate?: string,
    filters: {
      locationId?: string;
      serialNumber?: string;
      typeTransaction?: string;
      cardBrand?: string;
      maxPages?: number;
      pageSize?: number;
    } = {}
  ): Promise<{
    success: boolean;
    message: string;
    processedTransactions: number;
    createdTransactions: number;
    errors: string[];
    totalPages: number;
    pagesProcessed: number;
  }> {
    const syncId = `sync_paginated_${Date.now()}`;
    const startTime = new Date();
    const errors: string[] = [];
    let processedTransactions = 0;
    let createdTransactions = 0;
    let pagesProcessed = 0;
    let totalPages = 1;

    try {
      if (!this.isEnabled) {
        const message = 'POS sync is disabled or not configured properly';
        this.logger.warn(message);
        return {
          success: false,
          message,
          processedTransactions: 0,
          createdTransactions: 0,
          errors: [message],
          totalPages: 0,
          pagesProcessed: 0
        };
      }

      // Default date range: last 7 days to today
      const endDate = toDate || new Date().toISOString().split('T')[0];
      const startDate = fromDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      this.logger.log(`Starting paginated POS sync for date range: ${startDate} to ${endDate}`);

      // Create sync log entry
      const prismaAny = this.prisma as any;
      const syncLog = await prismaAny.pOSSyncLog.create({
        data: {
          syncType: 'MANUAL',
          status: 'RUNNING',
          startDate: new Date(startDate + 'T00:00:00.000Z'),
          endDate: new Date(endDate + 'T23:59:59.999Z'),
          startedAt: new Date(),
          apiEndpoint: '/BranchReport/branch-report',
          tenantId: null
        }
      });

      try {
        const pageSize = Math.min(filters.pageSize || 20, 20); // Max 20 per API docs
        const maxPages = filters.maxPages || 50; // Prevent runaway pagination
        const chunks = this.chunkDateRange(startDate, endDate, 30);

        for (const chunk of chunks) {
          let currentPage = 1;
          do {
            // Fetch data from Tuu BranchReport API with pagination per chunk
            const branchReportResponse = await this.getBranchReportData({
              from: chunk.from,
              to: chunk.to,
              page: currentPage,
              pageSize,
              locationId: filters.locationId,
              serialNumber: filters.serialNumber,
              typeTransaction: filters.typeTransaction,
              cardBrand: filters.cardBrand,
            });

            const branches = this.extractBranchData(branchReportResponse);
            if (!branches.length) {
              this.logger.warn(`No data received from Tuu API for page ${currentPage} (range ${chunk.from}..${chunk.to})`);
              break;
            }

            // Update pagination info
            totalPages = branchReportResponse.pagination?.totalPages || 1;
            pagesProcessed = currentPage;

            this.logger.log(`Processing page ${currentPage} of ${totalPages} (${branches.length} records) for range ${chunk.from}..${chunk.to}`);

            // Process each branch's data
            for (const branchData of branches) {
              const sales = Array.isArray((branchData as any).sales) ? (branchData as any).sales : [];
              for (const sale of sales) {
                try {
                  processedTransactions++;

                  // Generate ID if missing - use multiple fallback strategies
                  let transactionId = sale.id;
                  if (!transactionId || transactionId === undefined || transactionId === null || transactionId === '') {
                    // Try different ID fields that might exist
                    transactionId = sale.transactionId || sale.saleId || sale.tuuSaleId;

                    // If still no ID, generate one using available data
                    if (!transactionId) {
                      const timestamp = sale.transactionDateTime || new Date().toISOString();
                      const serial = sale.serialNumber || 'unknown';
                      const amount = sale.totalAmount || sale.saleAmount || 0;
                      const sequence = sale.sequenceNumber || Math.floor(Math.random() * 10000);
                      transactionId = `${serial}-${timestamp.replace(/[^0-9]/g, '').slice(0, 14)}-${amount}-${sequence}`;
                      this.logger.warn(`Generated fallback ID for paginated transaction: ${transactionId}`);
                    }
                  }

                  // Final validation - ensure we have a valid ID
                  if (!transactionId || transactionId === undefined || transactionId === null || transactionId === '') {
                    const errorMsg = `Skipping transaction - unable to generate valid ID: ${JSON.stringify(sale)}`;
                    errors.push(errorMsg);
                    this.logger.warn(errorMsg);
                    continue;
                  }

                  if (!sale.transactionDateTime) {
                    const errorMsg = `Skipping transaction ${transactionId} with missing transactionDateTime`;
                    errors.push(errorMsg);
                    this.logger.warn(errorMsg);
                    continue;
                  }

                  if (!sale.saleAmount && sale.saleAmount !== 0) {
                    const errorMsg = `Skipping transaction ${transactionId} with missing saleAmount`;
                    errors.push(errorMsg);
                    this.logger.warn(errorMsg);
                    continue;
                  }

                  if (!sale.totalAmount && sale.totalAmount !== 0) {
                    const errorMsg = `Skipping transaction ${transactionId} with missing totalAmount`;
                    errors.push(errorMsg);
                    this.logger.warn(errorMsg);
                    continue;
                  }

                  if (!sale.transactionType) {
                    const errorMsg = `Skipping transaction ${transactionId} with missing transactionType`;
                    errors.push(errorMsg);
                    this.logger.warn(errorMsg);
                    continue;
                  }

                  // Check if transaction already exists using the generated/validated ID
                  const existingTransaction = await prismaAny.pOSTransaction.findUnique({
                    where: { tuuSaleId: transactionId }
                  });

                  if (!existingTransaction) {
                    // Create new transaction with items
                    await prismaAny.pOSTransaction.create({
                      data: {
                        tuuSaleId: transactionId,
                        sequenceNumber: sale.sequenceNumber,
                        serialNumber: sale.serialNumber,
                        locationId: branchData.location.id,
                        address: branchData.location.address,
                        merchant: branchData.merchant,
                        status: this.mapTuuStatusToPrisma(sale.status),
                        transactionDateTime: new Date(sale.transactionDateTime),
                        transactionType: sale.transactionType,
                        saleAmount: sale.saleAmount,
                        totalAmount: sale.totalAmount,
                        tenantId: null,
                        createdBy: 'pos-sync-paginated',
                        items: {
                          create: sale.items?.map(item => ({
                            code: item.code,
                            name: item.name,
                            quantity: item.quantity,
                            price: item.price,
                            tenantId: null,
                            createdBy: 'pos-sync-paginated',
                          })) || []
                        },
                        syncLogs: {
                          connect: { id: syncLog.id }
                        }
                      },
                      include: {
                        items: true
                      }
                    });

                    createdTransactions++;
                    this.logger.debug(`Created paginated transaction: ${transactionId} (original: ${sale.id})`);
                  } else {
                    this.logger.debug(`Paginated transaction already exists: ${transactionId} (original: ${sale.id})`);
                  }
                } catch (error) {
                  const usedId = transactionId || sale.id || 'unknown';
                  const errorMsg = `Failed to process paginated transaction ${usedId}: ${error.message}`;
                  errors.push(errorMsg);
                  this.logger.error(errorMsg, error);
                }
              }
            }

            currentPage++;

            // Prevent infinite loops and respect API rate limits
            if (currentPage > maxPages || currentPage > totalPages) {
              break;
            }

            // Add small delay between API calls to respect rate limits
            if (currentPage <= totalPages) {
              await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
            }

          } while (currentPage <= totalPages);
        }

        // Update sync log with error
        await this.prisma.pOSSyncLog.update({
          where: { id: syncLog.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            totalProcessed: processedTransactions,
            totalCreated: createdTransactions,
            totalErrors: errors.length,
            errorDetails: errors.length > 0 ? { errors } : null
          }
        });

        const message = `Paginated sync completed successfully. Processed: ${processedTransactions}, Created: ${createdTransactions}, Pages: ${pagesProcessed}/${totalPages}`;
        this.logger.log(message);

        return {
          success: true,
          message,
          processedTransactions,
          createdTransactions,
          errors,
          totalPages,
          pagesProcessed
        };

      } catch (error) {
        // Update sync log with failure
        const prismaAny4 = this.prisma as any;
        await prismaAny4.pOSSyncLog.update({
          where: { id: syncLog.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            totalProcessed: processedTransactions,
            totalCreated: createdTransactions,
            totalErrors: errors.length + 1,
            errorMessage: error.message,
            errorDetails: { errors: [...errors, error.message] }
          }
        });

        throw error;
      }

    } catch (error) {
      const message = `Paginated POS sync failed: ${error.message}`;
      this.logger.error(message, error);
      
      return {
        success: false,
        message,
        processedTransactions,
        createdTransactions,
        errors: [...errors, error.message],
        totalPages,
        pagesProcessed
      };
    }
  }

  private mapTuuStatusToPrisma(tuuStatus: string): any {
    switch (tuuStatus) {
      case 'SUCCESSFUL':
        return 'COMPLETED';
      case 'FAILED':
        return 'FAILED';
      case 'PENDING':
        return 'PENDING';
      default:
        this.logger.warn(`Unknown Tuu status '${tuuStatus}', mapping to FAILED`);
        return 'FAILED'; // treat unknown as failed to avoid enum issues
    }
  }

  // Test method to verify database insertion works
  async testDatabaseInsertion(): Promise<any> {
    try {
      this.logger.log('Testing database insertion with known good data...');
      
      const testTransaction = await this.prisma.pOSTransaction.create({
        data: {
          tuuSaleId: `test-${Date.now()}`,
          status: 'COMPLETED',
          transactionDateTime: new Date(),
          transactionType: 'DEBIT',
          saleAmount: 1000.00,
          totalAmount: 1000.00,
          tenantId: null,
          sequenceNumber: 'TEST-001',
          serialNumber: 'TEST-SERIAL',
          locationId: 'test-location',
          address: 'Test Address'
        }
      });
      
      this.logger.log('Test transaction created successfully:', testTransaction);
      
      // Clean up test data
      await this.prisma.pOSTransaction.delete({
        where: { id: testTransaction.id }
      });
      
      this.logger.log('Test transaction deleted successfully');
      return { success: true, message: 'Database insertion test passed' };
    } catch (error) {
      this.logger.error('Test insertion failed:', {
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      return { success: false, error: error.message, details: error };
    }
  }

  // Normalize branch report responses to a common iterable shape
  private extractBranchData(resp: any): Array<{ merchant: string; location: { id: string; address: string }; sales: any[] }> {
    if (!resp) return [];
    const data = resp.data ?? resp?.Data ?? null;

    // If already an array of branches
    if (Array.isArray(data)) return data as any[];

    // If single branch object with sales array
    if (data && typeof data === 'object' && Array.isArray((data as any).sales)) {
      return [data as any];
    }

    // Report Generation API shape: { commerce, transactions: [...] }
    if (data && typeof data === 'object' && Array.isArray((data as any).transactions)) {
      const txs = (data as any).transactions as any[];
      const branchLike = {
        merchant: data.commerce?.name || 'unknown',
        location: { id: 'unknown', address: '' },
        sales: txs.map(t => {
          // Use a combination of fields to create a unique ID
          const generatedId = t.id || t.transactionId || `${t.serialNumber}-${t.dateTime}-${t.amount}`;
          
          // Debug: Log the ID generation process
          console.log('ID Generation Debug:', {
            originalId: t.id,
            transactionId: t.transactionId,
            serialNumber: t.serialNumber,
            dateTime: t.dateTime,
            amount: t.amount,
            generatedId: generatedId
          });
          
          return {
            id: generatedId,
            sequenceNumber: t.sequenceNumber || undefined,
            serialNumber: t.serialNumber,
            status: t.status,
            transactionDateTime: t.dateTime || t.transactionDateTime,
            transactionType: t.type || t.transactionType,
            saleAmount: t.amount || t.saleAmount,
            totalAmount: t.amount || t.totalAmount,
            items: t.items || [],
          };
        })
      };
      return [branchLike as any];
    }

    // No iterable data
    return [];
  }

  private chunkDateRange(startYmd: string, endYmd: string, maxDays: number): Array<{ from: string; to: string }> {
    const chunks: Array<{ from: string; to: string }> = [];
    const start = new Date(startYmd + 'T00:00:00Z');
    const end = new Date(endYmd + 'T00:00:00Z');
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return chunks;
    let cur = new Date(start);
    while (cur <= end) {
      const chunkStart = new Date(cur);
      const chunkEnd = new Date(cur);
      chunkEnd.setUTCDate(chunkEnd.getUTCDate() + (maxDays - 1));
      if (chunkEnd > end) chunkEnd.setTime(end.getTime());
      chunks.push({ from: this.toYmd(chunkStart), to: this.toYmd(chunkEnd) });
      // next day after chunkEnd
      cur = new Date(chunkEnd);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return chunks;
  }

  private toYmd(d: Date): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private async cleanupOldData() {
    // No-op for now – retention requires soft-delete fields not present in schema
    return;
  }

  // Utility methods for managing sync
  async getPosConfiguration() {
    try {
      return await this.prisma.pOSConfiguration.findFirst();
    } catch (error) {
      this.logger.error('Failed to get POS configuration:', error);
      return null;
    }
  }

  async updatePosConfiguration(data: {
    apiKey?: string;
    baseUrl?: string;
    autoSyncEnabled?: boolean;
    syncIntervalHours?: number;
    maxDaysToSync?: number;
    retentionDays?: number;
  }) {
    const config = await this.prisma.pOSConfiguration.findFirst({
      where: {}
    });

    if (config) {
      const updated = await this.prisma.pOSConfiguration.update({
        where: { id: config.id },
        data: {
          ...data,
          updatedAt: new Date(),
        }
      });

      // Reinitialize API if configuration changed
      if (data.apiKey || data.baseUrl) {
        await this.initializeApi();
      }

      return updated;
    } else {
      const prismaAny9 = this.prisma as any;
      return prismaAny9.pOSConfiguration.create({
        data: {
          ...data,
          tenantId: null,
        }
      });
    }
  }

  async getSyncHistory(limit: number = 20) {
    try {
      return await this.prisma.pOSSyncLog.findMany({
        orderBy: { startedAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      this.logger.error('Failed to get sync history:', error);
      return [];
    }
  }

  async getPosTransactions(filters: {
    startDate?: string;
    endDate?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const {
      startDate,
      endDate,
      status,
      limit = 50,
      offset = 0
    } = filters;

    const where: any = {};

    if (startDate || endDate) {
      where.transactionDateTime = {};
      if (startDate) {
        where.transactionDateTime.gte = new Date(startDate + 'T00:00:00.000Z');
      }
      if (endDate) {
        where.transactionDateTime.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    if (status) {
      where.status = status;
    }

    const prismaAny11 = this.prisma as any;
    const [transactions, total] = await Promise.all([
      prismaAny11.pOSTransaction.findMany({
        where,
        include: {
          items: true,
        },
        orderBy: { transactionDateTime: 'desc' },
        take: limit,
        skip: offset,
      }),
      prismaAny11.pOSTransaction.count({ where })
    ]);

    return {
      transactions,
      total,
      limit,
      offset,
      hasMore: offset + transactions.length < total
    };
  }

  async getPosTransactionsAdvanced(filters: {
    startDate?: string;
    endDate?: string;
    status?: string;
    locationId?: string;
    serialNumber?: string;
    merchant?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const {
      startDate,
      endDate,
      status,
      locationId,
      serialNumber,
      merchant,
      limit = 50,
      offset = 0
    } = filters;

    const where: any = {};

    if (startDate || endDate) {
      where.transactionDateTime = {};
      if (startDate) {
        where.transactionDateTime.gte = new Date(startDate + 'T00:00:00.000Z');
      }
      if (endDate) {
        where.transactionDateTime.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    if (status) {
      where.status = status;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    if (serialNumber) {
      where.serialNumber = serialNumber;
    }

    if (merchant) {
      where.merchant = {
        contains: merchant,
        mode: 'insensitive'
      };
    }

    const prismaAny12 = this.prisma as any;
    const [transactions, total, locationStats, deviceStats] = await Promise.all([
      prismaAny12.pOSTransaction.findMany({
        where,
        include: {
          items: true,
        },
        orderBy: { transactionDateTime: 'desc' },
        take: limit,
        skip: offset,
      }),
      prismaAny12.pOSTransaction.count({ where }),
      // Get location breakdown
      prismaAny12.pOSTransaction.groupBy({
        by: ['locationId', 'address'],
        where,
        _count: { id: true },
        _sum: { totalAmount: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      // Get device breakdown
      prismaAny12.pOSTransaction.groupBy({
        by: ['serialNumber'],
        where,
        _count: { id: true },
        _sum: { totalAmount: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      })
    ]);

    return {
      transactions,
      total,
      limit,
      offset,
      hasMore: offset + transactions.length < total,
      analytics: {
        locationBreakdown: locationStats.map(stat => ({
          locationId: stat.locationId,
          address: stat.address,
          transactionCount: stat._count.id,
          totalAmount: stat._sum.totalAmount || 0
        })),
        deviceBreakdown: deviceStats.map(stat => ({
          serialNumber: stat.serialNumber,
          transactionCount: stat._count.id,
          totalAmount: stat._sum.totalAmount || 0
        }))
      }
    };
  }
}
