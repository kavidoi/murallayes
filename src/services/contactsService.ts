import { AuthService } from './authService';

export interface Contact {
  id: string;
  name: string;
  type: 'supplier' | 'customer' | 'important' | 'brand';
  entityType: 'business' | 'person';
  phone?: string;
  email?: string;
  instagram?: string;
  rut?: string;
  company?: string;
  address?: string;
  notes?: string;
  contactPersonName?: string;
  giro?: string;
  skuAbbreviation?: string;
  bankDetails?: any;
  tags?: string[];
  portalToken?: string;
  portalEnabled?: boolean;
  totalPurchases?: number;
  totalSales?: number;
  averagePurchase?: number;
  averageSale?: number;
  lastPurchaseAmount?: number;
  lastSaleAmount?: number;
  purchaseCount?: number;
  salesCount?: number;
  relationshipScore?: number;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  deletedAt?: string;
  deletedBy?: string;
  isDeleted: boolean;
  lastContact?: string;
}

export interface CreateContactData {
  name: string;
  type: 'supplier' | 'customer' | 'important' | 'brand';
  entityType: 'business' | 'person';
  phone?: string;
  email?: string;
  instagram?: string;
  rut?: string;
  company?: string;
  address?: string;
  notes?: string;
  contactPersonName?: string;
  giro?: string;
  skuAbbreviation?: string;
  bankDetails?: any;
  tags?: string[];
}

export interface UpdateContactData extends Partial<CreateContactData> {}

class ContactsService {
  async getAllContacts(): Promise<Contact[]> {
    return AuthService.apiCall<Contact[]>('/contacts');
  }

  async getContactById(id: string): Promise<Contact> {
    return AuthService.apiCall<Contact>(`/contacts/${id}`);
  }

  async createContact(contactData: CreateContactData): Promise<Contact> {
    return AuthService.apiCall<Contact>('/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    });
  }

  async updateContact(id: string, contactData: UpdateContactData): Promise<Contact> {
    return AuthService.apiCall<Contact>(`/contacts/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    });
  }

  async deleteContact(id: string): Promise<void> {
    await AuthService.apiCall<void>(`/contacts/${id}`, {
      method: 'DELETE',
    });
  }
}

export const contactsService = new ContactsService();
