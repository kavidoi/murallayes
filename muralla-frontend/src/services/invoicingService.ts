import axios from 'axios';
import { AuthService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export interface TaxDocument {
  id: string;
  type: 'BOLETA' | 'FACTURA' | 'CREDIT_NOTE';
  folio?: string;
  documentCode?: number;
  receiverRUT?: string;
  receiverName?: string;
  netAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  status: 'DRAFT' | 'ISSUED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  issuedAt?: string;
  pdfUrl?: string;
  createdAt: string;
}

class InvoicingService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/invoicing`,
    timeout: 20000,
  });

  constructor() {
    this.api.interceptors.request.use((config) => {
      const token = AuthService.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async health(rut?: string) {
    const res = await this.api.get('/health', { params: { rut } });
    return res.data;
  }

  async list(params: { type?: string; status?: string; startDate?: string; endDate?: string; search?: string } = {}) {
    const res = await this.api.get<TaxDocument[]>('/documents', { params });
    return res.data;
  }

  async issueBoletaFromPos(posTransactionId: string, payload: { receiverRUT?: string; receiverName?: string; sendEmail?: boolean; emitNow?: boolean } = {}) {
    const res = await this.api.post(`/boletas/from-pos/${posTransactionId}`, payload);
    return res.data;
  }

  async issueFacturaFromCost(costId: string, payload: { receiverRUT: string; receiverName?: string; receiverEmail?: string; emitNow?: boolean } ) {
    const res = await this.api.post(`/facturas/from-cost/${costId}`, payload);
    return res.data;
  }

  async getCostLinks(costIds: string[]) {
    const params = new URLSearchParams();
    if (costIds && costIds.length) params.set('ids', costIds.join(','));
    const res = await this.api.get(`/links/cost?${params.toString()}`);
    return res.data as Record<string, { count: number; status: string; folio?: string }>;
  }
}

export const invoicingService = new InvoicingService();
