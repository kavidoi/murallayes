import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
// Import type only to satisfy TS without emitting require
import type {} from '../prisma-v6-compat';

@Injectable()
export class PrismaService implements OnModuleInit {
  private prisma: PrismaClient;

  constructor() {
    const { PrismaClient: Client } = require('@prisma/client');
    this.prisma = new Client({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    try {
      // Add connection timeout
      const connectPromise = this.prisma.$connect();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timeout')), 10000)
      );

      await Promise.race([connectPromise, timeoutPromise]);
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.warn('⚠️ Database connection failed:', error.message);
      console.warn('📊 Application will continue with limited functionality');
      // Don't throw the error - allow the app to start without database
    }
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
  get taskAssignee() { return this.prisma.taskAssignee; }
  get project() { return this.prisma.project; }
  get budget() { return this.prisma.budget; }
  get budgetLine() { return this.prisma.budgetLine; }
  get comment() { return this.prisma.comment; }
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
  get productCategory() { return this.prisma.productCategory; }
  get bankAccount() { return this.prisma.bankAccount; }
  get magicToken() { return this.prisma.magicToken; }
  get contact() { return this.prisma.contact; }
  // Universal Relationship models
  get entityRelationship() { return (this.prisma as any).entityRelationship; }
  get relationshipType() { return (this.prisma as any).relationshipType; }

  // Recipe and ingredients models
  get recipe() { return this.prisma.recipe; }
  get recipeIngredient() { return this.prisma.recipeIngredient; }
  get productVariant() { return this.prisma.productVariant; }
  get ingredientUsage() { return this.prisma.ingredientUsage; }
  get variantSale() { return this.prisma.variantSale; }

  // Calendar models
  get calendarEvent() { return this.prisma.calendarEvent; }
  get staffShift() { return this.prisma.staffShift; }
  get cafeSchedule() { return this.prisma.cafeSchedule; }

  // Brand and supplier models
  get brand() { return this.prisma.brand; }
  get brandContact() { return this.prisma.brandContact; }
  get purchaseOrder() { return this.prisma.purchaseOrder; }
  get purchaseOrderLine() { return this.prisma.purchaseOrderLine; }
  get purchaseOrderSubSupplier() { return this.prisma.purchaseOrderSubSupplier; }

  // SKU system models
  get entitySKU() { return this.prisma.entitySKU; }
  get sKUTemplate() { return this.prisma.sKUTemplate; }

  // Payroll models
  get payroll() { return this.prisma.payroll; }
  get payrollEntry() { return this.prisma.payrollEntry; }
  get salaryAdjustment() { return this.prisma.salaryAdjustment; }
  get employeeExpense() { return this.prisma.employeeExpense; }

  // New product pipeline models
  get company() { return this.prisma.company; }
  get vendor() { return this.prisma.vendor; }
  get cost() { return this.prisma.cost; }
  get costLine() { return this.prisma.costLine; }
  get costCategory() { return this.prisma.costCategory; }
  get attachment() { return this.prisma.attachment; }
  get location() { return this.prisma.location; }
  get inventoryMove() { return this.prisma.inventoryMove; }
  get bOMComponent() { return this.prisma.bOMComponent; }
  get workOrder() { return this.prisma.workOrder; }
  get workOrderComponent() { return this.prisma.workOrderComponent; }
  get costTransactionLink() { return this.prisma.costTransactionLink; }

  // POS models
  get pOSConfiguration() { return this.prisma.pOSConfiguration; }
  get pOSTransaction() { return this.prisma.pOSTransaction; }
  get pOSTransactionItem() { return this.prisma.pOSTransactionItem; }
  // Invoicing
  get taxDocument() { return (this.prisma as any).taxDocument; }
  get taxDocumentItem() { return (this.prisma as any).taxDocumentItem; }
  get pOSSyncLog() { return this.prisma.pOSSyncLog; }

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
