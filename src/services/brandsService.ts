import { AuthService } from './authService';

// Types based on backend models
export interface Brand {
  id: string;
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  contacts?: BrandContact[];
}

export interface BrandContact {
  id: string;
  brandId: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  skuAbbreviation?: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  brand?: Brand;
}

export interface CreateBrandContactDto {
  brandId: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  skuAbbreviation?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface UpdateBrandContactDto {
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
  skuAbbreviation?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

class BrandsService {
  // Brand operations
  async getBrands(search?: string): Promise<Brand[]> {
    const endpoint = search ? `/brands?search=${encodeURIComponent(search)}` : '/brands';
    return AuthService.apiCall<Brand[]>(endpoint);
  }

  async getBrand(id: string): Promise<Brand> {
    return AuthService.apiCall<Brand>(`/brands/${id}`);
  }

  // Brand Contacts operations
  async getBrandContacts(brandId: string): Promise<BrandContact[]> {
    return AuthService.apiCall<BrandContact[]>(`/brands/${brandId}/contacts`);
  }

  async getAllBrandContacts(): Promise<BrandContact[]> {
    return AuthService.apiCall<BrandContact[]>('/suppliers/available-for-supplier');
  }

  async getBrandContact(id: string): Promise<BrandContact> {
    return AuthService.apiCall<BrandContact>(`/brands/contacts/${id}`);
  }

  async createBrandContact(data: CreateBrandContactDto): Promise<BrandContact> {
    return AuthService.apiCall<BrandContact>('/brands/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBrandContact(id: string, data: UpdateBrandContactDto): Promise<BrandContact> {
    return AuthService.apiCall<BrandContact>(`/brands/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteBrandContact(id: string): Promise<void> {
    return AuthService.apiCall<void>(`/brands/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  // Convert BrandContact to the Contact interface used in the component
  mapBrandContactToContact(brandContact: BrandContact): any {
    return {
      id: brandContact.id,
      name: brandContact.name,
      type: 'supplier', // Brand contacts are typically suppliers/brands
      entityType: 'business',
      phone: brandContact.phone,
      email: brandContact.email,
      company: brandContact.brand?.name || brandContact.name,
      notes: `SKU: ${brandContact.skuAbbreviation || 'N/A'}`,
      tags: ['marca', brandContact.skuAbbreviation?.toLowerCase() || 'brand'],
      createdAt: brandContact.createdAt,
      lastContact: brandContact.updatedAt,
      purchaseCount: 0,
      salesCount: 0,
      relationshipScore: brandContact.isPrimary ? 5 : 3,
      // Additional brand-specific data
      skuAbbreviation: brandContact.skuAbbreviation,
      role: brandContact.role,
      isPrimary: brandContact.isPrimary,
      isActive: brandContact.isActive
    };
  }
}

export const brandsService = new BrandsService();