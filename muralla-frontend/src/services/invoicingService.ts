import axios from 'axios';
import { AuthService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export interface TaxDocument {
  id: string;
  type: 'BOLETA' | 'FACTURA' | 'CREDIT_NOTE';
  folio?: string;
  documentCode?: number;

  // Receiver info (when we emit documents)
  receiverRUT?: string;
  receiverName?: string;
<<<<<<< HEAD

  // Emitter info (for received documents - supplier info)
  emitterRUT?: string;
  emitterName?: string;

  // Financial amounts
  netAmount?: number;
  taxAmount?: number;
  totalAmount?: number;

  // Status and dates
  status: 'DRAFT' | 'ISSUED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'ERROR';
=======
  emitterRUT?: string;
  emitterName?: string;
  emitterAddress?: string;
  emitterActivity?: string;
  netAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  montoNeto?: number;
  montoIVA?: number;
  montoTotal?: number;
  otherTaxes?: number;
  status: 'DRAFT' | 'ISSUED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  estadoRecepcion?: string;
  tipoDocumento?: number;
  fechaEmision?: string;
  fechaRecepcion?: string;
  paymentMethod?: string;
  purchaseType?: string;
>>>>>>> frontend-deploy
  issuedAt?: string;
  createdAt: string;
<<<<<<< HEAD

  // Document access
  pdfUrl?: string;
  xmlUrl?: string;

  // Enhanced metadata (from OpenFactura)
  notes?: string;
  rawResponse?: any;
  source?: string;
=======
  notes?: string;
  rawResponse?: any;
  source?: string;
  items?: Array<{
    description?: string;
    name?: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
>>>>>>> frontend-deploy
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

  // Enhanced document viewing
  async getDocumentPreview(id: string) {
    const res = await this.api.get(`/documents/${id}/preview`);
    return res.data;
  }

  // Get document PDF URL for inline viewing
  getDocumentPDFUrl(id: string, display: 'inline' | 'download' = 'inline') {
    const token = AuthService.getToken();
    const tokenParam = token ? `?token=${encodeURIComponent(token)}&display=${display}` : `?display=${display}`;
    return `${API_BASE_URL}/invoicing/documents/${id}/pdf${tokenParam}`;
  }

  // Get document XML URL
  getDocumentXMLUrl(id: string, display: 'inline' | 'download' = 'inline') {
    const token = AuthService.getToken();
    const tokenParam = token ? `?token=${encodeURIComponent(token)}&display=${display}` : `?display=${display}`;
    return `${API_BASE_URL}/invoicing/documents/${id}/xml${tokenParam}`;
  }

  // Fetch received documents from OpenFactura
  async fetchReceivedDocuments(params: {
    startDate?: string;
    endDate?: string;
    page?: number;
    tipoDocumento?: number;
    rutEmisor?: string;
  } = {}) {
    const res = await this.api.get('/received-documents', { params });
    return res.data;
  }

  // Import received documents into database
  async importReceivedDocuments(params: {
    startDate?: string;
    endDate?: string;
    dryRun?: boolean;
  } = {}) {
    const res = await this.api.post('/received-documents/import', params);
    return res.data;
  }

  // Send acknowledgment for received document
  async acknowledgeDocument(folio: string, params: {
    rutEmisor: string;
    tipoDocumento: number;
    tipoAcuse: 'ACD' | 'RCD' | 'ERM' | 'RFP' | 'RFT';
  }) {
    const res = await this.api.post(`/received-documents/${folio}/acknowledge`, params);
    return res.data;
  }
}

export const invoicingService = new InvoicingService();
