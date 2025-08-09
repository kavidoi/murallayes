import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
// Import type only to satisfy TS without emitting require
import type {} from '../prisma-v6-compat';

@Injectable()
export class PrismaService implements OnModuleInit {
  private prisma: PrismaClient;

  constructor() {
    const { PrismaClient: Client } = require('@prisma/client');
    this.prisma = new Client();
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  // Forward all PrismaClient methods and properties
  get $connect() { return this.prisma.$connect.bind(this.prisma); }
  get $disconnect() { return this.prisma.$disconnect.bind(this.prisma); }
  get $transaction() { return this.prisma.$transaction.bind(this.prisma); }
  get $queryRaw() { return this.prisma.$queryRaw.bind(this.prisma); }
  get $executeRaw() { return this.prisma.$executeRaw.bind(this.prisma); }

  // Delegate property getters for all models
  get user() { return this.prisma.user; }
  get role() { return this.prisma.role; }
  get task() { return this.prisma.task; }
  get project() { return this.prisma.project; }
  get pTORequest() { return this.prisma.pTORequest; }
  get pTOBalance() { return this.prisma.pTOBalance; }
  get notification() { return this.prisma.notification; }
  get notificationTemplate() { return this.prisma.notificationTemplate; }
  get notificationRule() { return this.prisma.notificationRule; }
  get document() { return this.prisma.document; }
  get documentRevision() { return this.prisma.documentRevision; }
  get product() { return this.prisma.product; }
  get sale() { return this.prisma.sale; }
  get transaction() { return this.prisma.transaction; }
  get transactionCategory() { return this.prisma.transactionCategory; }
  get bankAccount() { return this.prisma.bankAccount; }
  get magicToken() { return this.prisma.magicToken; }

  // Added for Prisma v6 compatibility – some generated types expect this method
  $queryRawUnsafe<T = unknown>(query: string, ...params: any[]): any {
    // @ts-ignore – not part of current PrismaClient but exists in some flavours; fallback to $queryRaw
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // Forward to the underlying (possibly hidden) implementation if present
    // Fallback to $queryRaw
    return (this as any).$queryRawUnsafe?.(query, ...params) ?? (this as any).$queryRaw?.(query, ...params);
  }
}
