import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { CreateBrandContactDto } from './dto/create-brand-contact.dto';
import { UpdateBrandContactDto } from './dto/update-brand-contact.dto';
import { Brand, BrandContact } from '@prisma/client';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async create(createBrandDto: CreateBrandDto, tenantId?: string): Promise<Brand> {
    // Check if brand name already exists
    const existingBrand = await this.prisma.brand.findFirst({
      where: { 
        name: createBrandDto.name,
        tenantId 
      }
    });

    if (existingBrand) {
      throw new ConflictException(`Brand with name "${createBrandDto.name}" already exists`);
    }

    return this.prisma.brand.create({
      data: {
        ...createBrandDto,
        tenantId,
      },
      include: {
        contacts: true,
        _count: {
          select: {
            products: true,
            contacts: true
          }
        }
      }
    });
  }

  async findAll(tenantId?: string) {
    return this.prisma.brand.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        contacts: {
          where: { isActive: true },
          orderBy: [
            { isPrimary: 'desc' },
            { name: 'asc' }
          ]
        },
        _count: {
          select: {
            products: true,
            contacts: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async findOne(id: string, tenantId?: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { 
        id, 
        tenantId,
        isActive: true 
      },
      include: {
        contacts: {
          where: { isActive: true },
          include: {
            vendors: true
          },
          orderBy: [
            { isPrimary: 'desc' },
            { name: 'asc' }
          ]
        },
        products: {
          where: { isActive: true },
          take: 20,
          orderBy: { name: 'asc' }
        }
      }
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto, tenantId?: string) {
    const brand = await this.findOne(id, tenantId);
    
    // Check for name conflicts if name is being updated
    if (updateBrandDto.name && updateBrandDto.name !== brand.name) {
      const existingBrand = await this.prisma.brand.findFirst({
        where: { 
          name: updateBrandDto.name,
          tenantId,
          id: { not: id }
        }
      });

      if (existingBrand) {
        throw new ConflictException(`Brand with name "${updateBrandDto.name}" already exists`);
      }
    }
    
    return this.prisma.brand.update({
      where: { id },
      data: updateBrandDto,
      include: {
        contacts: {
          where: { isActive: true }
        },
        _count: {
          select: {
            products: true,
            contacts: true
          }
        }
      }
    });
  }

  async remove(id: string, tenantId?: string) {
    const brand = await this.findOne(id, tenantId);
    
    return this.prisma.brand.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async searchBrands(query: string, tenantId?: string) {
    return this.prisma.brand.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        contacts: {
          where: { isActive: true },
          take: 3
        },
        _count: {
          select: {
            products: true,
            contacts: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  // Brand Contact Management
  async createContact(createBrandContactDto: CreateBrandContactDto, tenantId?: string): Promise<BrandContact> {
    // Verify brand exists
    const brand = await this.findOne(createBrandContactDto.brandId, tenantId);

    // If this is set as primary, unset other primary contacts
    if (createBrandContactDto.isPrimary) {
      await this.prisma.brandContact.updateMany({
        where: {
          brandId: createBrandContactDto.brandId,
          isPrimary: true
        },
        data: { isPrimary: false }
      });
    }

    return this.prisma.brandContact.create({
      data: {
        ...createBrandContactDto,
        tenantId,
      },
      include: {
        brand: true,
        vendors: true
      }
    });
  }

  async findAllContacts(brandId?: string, tenantId?: string) {
    const where: any = {
      tenantId,
      isActive: true,
    };

    if (brandId) {
      where.brandId = brandId;
    }

    return this.prisma.brandContact.findMany({
      where,
      include: {
        brand: true,
        vendors: true
      },
      orderBy: [
        { isPrimary: 'desc' },
        { name: 'asc' }
      ]
    });
  }

  async findOneContact(id: string, tenantId?: string) {
    const contact = await this.prisma.brandContact.findFirst({
      where: { 
        id, 
        tenantId,
        isActive: true 
      },
      include: {
        brand: true,
        vendors: {
          where: { isActive: true }
        }
      }
    });

    if (!contact) {
      throw new NotFoundException(`Brand contact with ID ${id} not found`);
    }

    return contact;
  }

  async updateContact(id: string, updateBrandContactDto: UpdateBrandContactDto, tenantId?: string) {
    const contact = await this.findOneContact(id, tenantId);
    
    // If this is being set as primary, unset other primary contacts for the same brand
    if (updateBrandContactDto.isPrimary) {
      await this.prisma.brandContact.updateMany({
        where: {
          brandId: contact.brandId,
          isPrimary: true,
          id: { not: id }
        },
        data: { isPrimary: false }
      });
    }
    
    return this.prisma.brandContact.update({
      where: { id },
      data: updateBrandContactDto,
      include: {
        brand: true,
        vendors: true
      }
    });
  }

  async removeContact(id: string, tenantId?: string) {
    const contact = await this.findOneContact(id, tenantId);
    
    return this.prisma.brandContact.update({
      where: { id },
      data: { isActive: false }
    });
  }

  // Removed: Use suppliers service with type=BRAND_CONTACT instead
}
