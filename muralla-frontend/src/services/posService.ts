import axios from 'axios';
import { AuthService } from './authService';

// Default to backend dev port 4000 to match backend/src/main.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export interface POSTransaction {
  id: string;
  tuuSaleId: string;
  sequenceNumber?: string;
  serialNumber?: string;
  locationId?: string;
  address?: string;
  merchant?: string;
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING' | 'UNKNOWN';
  transactionDateTime: string;
  transactionType: string;
  saleAmount: number;
  totalAmount: number;
  items?: POSTransactionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface POSTransactionItem {
  id: string;
  code?: string;
  name: string;
  quantity: number;
  price: number;
}

export interface POSConfiguration {
  id: string;
  apiKey?: string;
  baseUrl?: string;
  autoSyncEnabled: boolean;
  syncIntervalHours: number;
  maxDaysToSync: number;
  retentionDays: number;
  hasApiKey?: boolean;
}

export interface POSSyncLog {
  id: string;
  syncType: 'MANUAL' | 'SCHEDULED';
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  startTime: string;
  endTime?: string;
  dateRangeFrom?: string;
  dateRangeTo?: string;
  totalProcessed?: number;
  totalCreated?: number;
  errorMessages?: string[];
  hasErrors?: boolean;
}

export interface POSSyncResult {
  success: boolean;
  message: string;
  data: {
    processedTransactions: number;
    createdTransactions: number;
    errors: string[];
  };
}

export interface POSTransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  successfulTransactions: number;
  successfulAmount: number;
  failedTransactions: number;
  failedAmount: number;
  pendingTransactions: number;
  pendingAmount: number;
  successRate: number;
  dailyBreakdown: Array<{
    date: string;
    transaction_count: number;
    total_amount: number;
    successful_count: number;
    successful_amount: number;
  }>;
}

export interface POSHealthCheck {
  configured: boolean;
  enabled: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  lastSuccessfulSyncAt?: string;
  totalSyncs: number;
  recentSyncs: Array<{
    id: string;
    status: string;
    startTime: string;
    endTime?: string;
    processedTransactions?: number;
    createdTransactions?: number;
    hasErrors: boolean;
  }>;
}

export interface POSTransactionFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface POSTransactionsResponse {
  transactions: POSTransaction[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

class POSService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/pos`,
    timeout: 30000,
  });

  constructor() {
    // Add auth interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = AuthService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          AuthService.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Manual sync trigger
  async triggerSync(fromDate?: string, toDate?: string): Promise<POSSyncResult> {
    const response = await this.api.post('/sync', {
      fromDate,
      toDate,
    });
    return response.data;
  }

  // Get POS configuration
  async getConfiguration(): Promise<POSConfiguration> {
    const response = await this.api.get('/configuration');
    return response.data;
  }

  // Update POS configuration
  async updateConfiguration(data: {
    apiKey?: string;
    baseUrl?: string;
    autoSyncEnabled?: boolean;
    syncIntervalHours?: number;
    maxDaysToSync?: number;
    retentionDays?: number;
  }): Promise<POSConfiguration> {
    const response = await this.api.post('/configuration', data);
    return response.data;
  }

  // Get sync history
  async getSyncHistory(limit?: number): Promise<POSSyncLog[]> {
    const response = await this.api.get('/sync-history', {
      params: { limit },
    });
    return response.data;
  }

  // Get POS transactions with filtering and pagination
  async getTransactions(filters: POSTransactionFilters = {}): Promise<POSTransactionsResponse> {
    const response = await this.api.get('/transactions', {
      params: filters,
    });
    return response.data;
  }

  // Get transaction summary/analytics
  async getTransactionSummary(startDate?: string, endDate?: string): Promise<POSTransactionSummary> {
    const response = await this.api.get('/summary', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  // Get POS health check
  async getHealth(): Promise<POSHealthCheck> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Format currency amount
  formatAmount(amount: number, currency: string = 'CLP'): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Format date for display
  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  // Format time for display
  formatTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Format date and time for display
  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get status badge color
  getStatusColor(status: string): string {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS':
      case 'SUCCESSFUL':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'FAILED':
      case 'ERROR':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'PENDING':
      case 'RUNNING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  // Format currency
  formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  }
}

export const posService = new POSService();
