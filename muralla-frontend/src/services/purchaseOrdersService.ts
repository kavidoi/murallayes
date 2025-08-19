import { AuthService } from './authService'

export interface CostLine {
  id?: string
  productId?: string | null
  isInventory?: boolean
  quantity?: number | string | null
  unitCost?: number | string | null
  totalCost?: number | string | null
  locationId?: string | null
  description?: string | null
}

export interface Attachment {
  id?: string
  fileName?: string | null
  fileUrl: string
  fileType?: string | null
  fileSize?: number | null
  ocrData?: any
  uploadedBy?: string | null
}

export interface CostDTO {
  id: string
  companyId: string
  categoryId?: string
  vendorId?: string
  docType: string
  docNumber?: string | null
  date: string
  total: number
  currency: string
  payerType: 'COMPANY' | 'STAFF'
  payerCompanyId?: string | null
  staffId?: string | null
  bankAccountId?: string | null
  description?: string | null
  status?: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED'
  lines?: CostLine[]
  attachments?: Attachment[]
  vendor?: { id: string; name?: string }
  category?: { id: string; name?: string }
  company?: { id: string; name?: string }
}

export interface ListParams {
  companyId?: string
  vendorId?: string
  categoryId?: string
  dateFrom?: string
  dateTo?: string
  take?: number
  skip?: number
}

function buildQuery(params: Record<string, any>): string {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v))
  })
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export const PurchaseOrdersService = {
  async list(params: ListParams = {}): Promise<CostDTO[]> {
    const res = await AuthService.apiCall<CostDTO[]>(`/costs${buildQuery(params)}`)
    // Narrow to Purchase Orders heuristically: costs that have inventory-related lines
    return (res || []).filter(c => {
      const lines = c.lines || []
      return lines.some(l => l.isInventory || l.productId)
    })
  },

  async get(id: string): Promise<CostDTO> {
    return AuthService.apiCall<CostDTO>(`/costs/${id}`)
  },

  async create(data: Partial<CostDTO>): Promise<CostDTO> {
    // Expecting docType, date, total, currency, payerType, companyId, categoryId, optional vendorId, description, lines[], attachments[]
    return AuthService.apiCall<CostDTO>(`/costs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },

  async uploadReceipt(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    return AuthService.upload(`/costs/upload`, fd, 'POST')
  },
}
