import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto, tenantId?: string) {
    return this.prisma.contact.create({
      data: {
        ...createContactDto,
        tenantId,
        tags: createContactDto.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async findAll(tenantId?: string, search?: string, type?: string) {
    const where: any = {
      tenantId,
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    return this.prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId?: string) {
    return this.prisma.contact.findFirst({
      where: {
        id,
        tenantId,
        isDeleted: false,
      },
    });
  }

  async update(id: string, updateContactDto: UpdateContactDto, tenantId?: string) {
    const contact = await this.findOne(id, tenantId);
    if (!contact) {
      throw new Error('Contact not found');
    }

    return this.prisma.contact.update({
      where: { id },
      data: {
        ...updateContactDto,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: string, tenantId?: string) {
    const contact = await this.findOne(id, tenantId);
    if (!contact) {
      throw new Error('Contact not found');
    }

    return this.prisma.contact.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}
