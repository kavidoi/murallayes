import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Vendor, VendorType } from '@prisma/client';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async generateSupplierNumber(): Promise<string> {
    const lastSupplier = await this.prisma.vendor.findFirst({
      where: { internalNumber: { startsWith: 'SUPP-' } },
      orderBy: { internalNumber: 'desc' }
    });
    
    let nextNumber = 1;
    if (lastSupplier?.internalNumber) {
      const currentNumber = parseInt(lastSupplier.internalNumber.split('-')[1]);
      nextNumber = currentNumber + 1;
    }
    
    return `SUPP-${nextNumber.toString().padStart(3, '0')}`;
  }

  async create(createSupplierDto: CreateSupplierDto, tenantId?: string): Promise<Vendor> {
    const internalNumber = await this.generateSupplierNumber();
    
    return this.prisma.vendor.create({
      data: {
        ...createSupplierDto,
        internalNumber,
        tenantId,
      },
      include: {
        brandContact: {
          include: {
            brand: true
          }
        }
      }
    });
  }

  async findAll(tenantId?: string) {
    return this.prisma.vendor.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        brandContact: {
          include: {
            brand: true
          }
        },
        _count: {
          select: {
            costs: true,
            mainSupplierOrders: true,
            subSupplierOrders: true
          }
        }
      },
      orderBy: { internalNumber: 'asc' }
    });
  }

  async findOne(id: string, tenantId?: string) {
    const supplier = await this.prisma.vendor.findFirst({
      where: { 
        id, 
        tenantId,
        isActive: true 
      },
      include: {
        brandContact: {
          include: {
            brand: true
          }
        },
        costs: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        mainSupplierOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        subSupplierOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto, tenantId?: string) {
    const supplier = await this.findOne(id, tenantId);
    
    return this.prisma.vendor.update({
      where: { id },
      data: updateSupplierDto,
      include: {
        brandContact: {
          include: {
            brand: true
          }
        }
      }
    });
  }

  async remove(id: string, tenantId?: string) {
    const supplier = await this.findOne(id, tenantId);
    
    return this.prisma.vendor.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async convertBrandContactToSupplier(brandContactId: string, paymentTerms?: string, tenantId?: string) {
    const brandContact = await this.prisma.brandContact.findUnique({
      where: { id: brandContactId },
      include: { brand: true }
    });

    if (!brandContact) {
      throw new NotFoundException(`Brand contact with ID ${brandContactId} not found`);
    }

    // Check if already converted
    const existingSupplier = await this.prisma.vendor.findFirst({
      where: { brandContactId }
    });

    if (existingSupplier) {
      throw new ConflictException('Brand contact is already converted to supplier');
    }

    const internalNumber = await this.generateSupplierNumber();
    
    return this.prisma.vendor.create({
      data: {
        internalNumber,
        name: `${brandContact.brand.name} - ${brandContact.name}`,
        email: brandContact.email,
        phone: brandContact.phone,
        contactName: brandContact.name,
        vendorType: VendorType.BRAND_CONTACT,
        brandContactId,
        paymentTerms,
        tenantId
      },
      include: {
        brandContact: {
          include: {
            brand: true
          }
        }
      }
    });
  }

  async findByType(vendorType: VendorType, tenantId?: string) {
    return this.prisma.vendor.findMany({
      where: {
        vendorType,
        tenantId,
        isActive: true,
      },
      include: {
        brandContact: {
          include: {
            brand: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async searchSuppliers(query: string, tenantId?: string) {
    return this.prisma.vendor.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { internalNumber: { contains: query, mode: 'insensitive' } },
          { taxId: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        brandContact: {
          include: {
            brand: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }
}
