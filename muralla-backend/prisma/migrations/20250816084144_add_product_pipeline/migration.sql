-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('WIKI', 'SOP', 'PLAYBOOK', 'TEMPLATE');

-- CreateEnum
CREATE TYPE "public"."DocumentStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('MERCADO_PAGO', 'BANK_TRANSFER', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'CHECK', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AuditOperation" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('EMAIL', 'PUSH', 'IN_APP', 'SMS');

-- CreateEnum
CREATE TYPE "public"."NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."RuleTrigger" AS ENUM ('TASK_CREATED', 'TASK_UPDATED', 'TASK_COMPLETED', 'DOCUMENT_CREATED', 'DOCUMENT_UPDATED', 'USER_REGISTERED', 'PROJECT_CREATED', 'DEADLINE_APPROACHING', 'STOCK_LOW', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."LocationType" AS ENUM ('WAREHOUSE', 'STORE', 'PRODUCTION', 'OFFICE');

-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('INSUMO', 'TERMINADO', 'SERVICIO');

-- CreateEnum
CREATE TYPE "public"."InventoryMoveType" AS ENUM ('ENTRADA_COMPRA', 'ENTRADA_PRODUCCION', 'SALIDA_PRODUCCION', 'SALIDA_VENTA', 'TRASLADO', 'AJUSTE', 'MERMA', 'DEVOLUCION');

-- CreateEnum
CREATE TYPE "public"."DocumentKind" AS ENUM ('FACTURA', 'BOLETA', 'RECIBO', 'OTRO');

-- CreateEnum
CREATE TYPE "public"."PayerType" AS ENUM ('COMPANY', 'STAFF');

-- CreateEnum
CREATE TYPE "public"."CostStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ReimbursementStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID');

-- CreateEnum
CREATE TYPE "public"."WorkOrderStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PTOStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PayrollStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."SalaryAdjustmentType" AS ENUM ('SALARY_INCREASE', 'SALARY_DECREASE', 'BONUS', 'ALLOWANCE_CHANGE', 'PROMOTION', 'DEMOTION', 'ANNUAL_REVIEW');

-- CreateEnum
CREATE TYPE "public"."ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'PENDING',
    "projectId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "type" "public"."DocumentType" NOT NULL,
    "status" "public"."DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "tags" TEXT[],
    "parentId" TEXT,
    "authorId" TEXT NOT NULL,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."document_revisions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "changeLog" TEXT,
    "authorId" TEXT NOT NULL,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."ProductType" NOT NULL DEFAULT 'TERMINADO',
    "uom" TEXT NOT NULL DEFAULT 'UN',
    "categoryId" TEXT,
    "unitCost" DECIMAL(10,4),
    "price" DOUBLE PRECISION,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "soldBy" TEXT NOT NULL,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bank_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountNumber" TEXT,
    "bankName" TEXT,
    "accountType" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transaction_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transactions" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "paymentMethod" "public"."PaymentMethod" NOT NULL DEFAULT 'MERCADO_PAGO',
    "reference" TEXT,
    "externalId" TEXT,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT,
    "companyId" TEXT,
    "customerName" TEXT,
    "supplierName" TEXT,
    "employeeName" TEXT,
    "projectName" TEXT,
    "items" JSONB,
    "notes" TEXT,
    "receiptUrl" TEXT,
    "mpPaymentId" TEXT,
    "mpStatus" TEXT,
    "mpPaymentType" TEXT,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "payrollId" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bank_balances" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "balanceDate" TIMESTAMP(3) NOT NULL,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "roleId" TEXT NOT NULL,
    "tenantId" TEXT,
    "refreshToken" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."magic_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "magic_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_trail" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "operation" "public"."AuditOperation" NOT NULL,
    "beforeData" JSONB,
    "afterData" JSONB,
    "userId" TEXT,
    "tenantId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "audit_trail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."NotificationType" NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "variables" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" "public"."RuleTrigger" NOT NULL,
    "conditions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "templateId" TEXT NOT NULL,
    "recipients" JSONB NOT NULL,
    "delay" INTEGER,
    "createdBy" TEXT NOT NULL,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "status" "public"."NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "templateId" TEXT,
    "ruleId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "readAt" TIMESTAMP(3),
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "contactName" TEXT,
    "paymentTerms" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "isInventory" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."costs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT,
    "vendorId" TEXT,
    "docType" "public"."DocumentKind" NOT NULL,
    "docNumber" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CLP',
    "payerType" "public"."PayerType" NOT NULL DEFAULT 'COMPANY',
    "payerCompanyId" TEXT,
    "staffId" TEXT,
    "bankAccountId" TEXT,
    "description" TEXT,
    "status" "public"."CostStatus" NOT NULL DEFAULT 'PENDING',
    "reimbursementStatus" "public"."ReimbursementStatus",
    "tenantId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cost_lines" (
    "id" TEXT NOT NULL,
    "costId" TEXT NOT NULL,
    "productId" TEXT,
    "isInventory" BOOLEAN NOT NULL DEFAULT false,
    "quantity" DECIMAL(12,3),
    "unitCost" DECIMAL(12,4),
    "totalCost" DECIMAL(12,2) NOT NULL,
    "locationId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attachments" (
    "id" TEXT NOT NULL,
    "costId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "ocrData" JSONB,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."LocationType" NOT NULL,
    "address" TEXT,
    "companyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_moves" (
    "id" TEXT NOT NULL,
    "type" "public"."InventoryMoveType" NOT NULL,
    "productId" TEXT NOT NULL,
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitCost" DECIMAL(12,4),
    "totalCost" DECIMAL(12,2),
    "reason" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "lotCode" TEXT,
    "expiryDate" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_moves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bom_components" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "uom" TEXT NOT NULL,
    "unitCost" DECIMAL(12,4),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."work_orders" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "qtyPlanned" DECIMAL(12,3) NOT NULL,
    "qtyProduced" DECIMAL(12,3),
    "qtyScrap" DECIMAL(12,3),
    "lotCode" TEXT,
    "status" "public"."WorkOrderStatus" NOT NULL DEFAULT 'PLANNED',
    "plannedCost" DECIMAL(12,2),
    "actualCost" DECIMAL(12,2),
    "yieldPercent" DECIMAL(5,2),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."work_order_components" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qtyPlanned" DECIMAL(12,3) NOT NULL,
    "qtyConsumed" DECIMAL(12,3),
    "unitCost" DECIMAL(12,4),
    "totalCost" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cost_transaction_links" (
    "id" TEXT NOT NULL,
    "costId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" DECIMAL(12,2),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_transaction_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payrolls" (
    "id" TEXT NOT NULL,
    "runDate" TIMESTAMP(3) NOT NULL,
    "payPeriodStart" TIMESTAMP(3) NOT NULL,
    "payPeriodEnd" TIMESTAMP(3) NOT NULL,
    "status" "public"."PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "totalGrossPay" DECIMAL(12,2) NOT NULL,
    "totalDeductions" DECIMAL(12,2) NOT NULL,
    "totalNetPay" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payroll_entries" (
    "id" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "baseSalary" DECIMAL(10,2) NOT NULL,
    "hoursWorked" DECIMAL(5,2),
    "overtimeHours" DECIMAL(5,2),
    "bonusAmount" DECIMAL(10,2),
    "allowances" DECIMAL(10,2),
    "grossPay" DECIMAL(10,2) NOT NULL,
    "taxDeductions" DECIMAL(10,2) NOT NULL,
    "socialSecurity" DECIMAL(10,2) NOT NULL,
    "otherDeductions" DECIMAL(10,2),
    "netPay" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salary_adjustments" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "adjustmentType" "public"."SalaryAdjustmentType" NOT NULL,
    "previousAmount" DECIMAL(10,2) NOT NULL,
    "newAmount" DECIMAL(10,2) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_expenses" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "status" "public"."ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reimbursedAt" TIMESTAMP(3),
    "reimbursementTransactionId" TEXT,
    "notes" TEXT,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pto_requests" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" DECIMAL(5,2) NOT NULL,
    "status" "public"."PTOStatus" NOT NULL DEFAULT 'DRAFT',
    "reason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pto_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pto_balances" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalDays" DECIMAL(5,2) NOT NULL,
    "usedDays" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "carryOverDays" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pto_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "public"."roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "documents_slug_key" ON "public"."documents"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "document_revisions_documentId_version_key" ON "public"."document_revisions"("documentId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "public"."products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_categories_name_key" ON "public"."transaction_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_reference_key" ON "public"."transactions"("reference");

-- CreateIndex
CREATE INDEX "transactions_accountId_idx" ON "public"."transactions"("accountId");

-- CreateIndex
CREATE INDEX "transactions_categoryId_idx" ON "public"."transactions"("categoryId");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "public"."transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "public"."transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_createdAt_idx" ON "public"."transactions"("createdAt");

-- CreateIndex
CREATE INDEX "transactions_reference_idx" ON "public"."transactions"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_mpPaymentId_key" ON "public"."transactions"("mpPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_balances_balanceDate_key" ON "public"."bank_balances"("balanceDate");

-- CreateIndex
CREATE INDEX "bank_balances_accountId_idx" ON "public"."bank_balances"("accountId");

-- CreateIndex
CREATE INDEX "bank_balances_balanceDate_idx" ON "public"."bank_balances"("balanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE INDEX "magic_tokens_tokenHash_idx" ON "public"."magic_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "magic_tokens_userId_idx" ON "public"."magic_tokens"("userId");

-- CreateIndex
CREATE INDEX "magic_tokens_expiresAt_idx" ON "public"."magic_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "audit_trail_tableName_recordId_idx" ON "public"."audit_trail"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "audit_trail_userId_idx" ON "public"."audit_trail"("userId");

-- CreateIndex
CREATE INDEX "audit_trail_timestamp_idx" ON "public"."audit_trail"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_name_key" ON "public"."notification_templates"("name");

-- CreateIndex
CREATE INDEX "notifications_recipientId_status_idx" ON "public"."notifications"("recipientId", "status");

-- CreateIndex
CREATE INDEX "notifications_scheduledAt_idx" ON "public"."notifications"("scheduledAt");

-- CreateIndex
CREATE INDEX "notifications_entityType_entityId_idx" ON "public"."notifications"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "public"."companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_name_key" ON "public"."product_categories"("name");

-- CreateIndex
CREATE INDEX "costs_companyId_idx" ON "public"."costs"("companyId");

-- CreateIndex
CREATE INDEX "costs_categoryId_idx" ON "public"."costs"("categoryId");

-- CreateIndex
CREATE INDEX "costs_vendorId_idx" ON "public"."costs"("vendorId");

-- CreateIndex
CREATE INDEX "costs_date_idx" ON "public"."costs"("date");

-- CreateIndex
CREATE INDEX "cost_lines_costId_idx" ON "public"."cost_lines"("costId");

-- CreateIndex
CREATE INDEX "cost_lines_productId_idx" ON "public"."cost_lines"("productId");

-- CreateIndex
CREATE INDEX "attachments_costId_idx" ON "public"."attachments"("costId");

-- CreateIndex
CREATE INDEX "inventory_moves_productId_idx" ON "public"."inventory_moves"("productId");

-- CreateIndex
CREATE INDEX "inventory_moves_fromLocationId_idx" ON "public"."inventory_moves"("fromLocationId");

-- CreateIndex
CREATE INDEX "inventory_moves_toLocationId_idx" ON "public"."inventory_moves"("toLocationId");

-- CreateIndex
CREATE INDEX "inventory_moves_createdAt_idx" ON "public"."inventory_moves"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "bom_components_productId_componentId_key" ON "public"."bom_components"("productId", "componentId");

-- CreateIndex
CREATE INDEX "work_orders_productId_idx" ON "public"."work_orders"("productId");

-- CreateIndex
CREATE INDEX "work_orders_locationId_idx" ON "public"."work_orders"("locationId");

-- CreateIndex
CREATE INDEX "work_orders_status_idx" ON "public"."work_orders"("status");

-- CreateIndex
CREATE INDEX "cost_transaction_links_transactionId_idx" ON "public"."cost_transaction_links"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "cost_transaction_links_costId_transactionId_key" ON "public"."cost_transaction_links"("costId", "transactionId");

-- CreateIndex
CREATE INDEX "payrolls_runDate_idx" ON "public"."payrolls"("runDate");

-- CreateIndex
CREATE INDEX "payrolls_status_idx" ON "public"."payrolls"("status");

-- CreateIndex
CREATE INDEX "payrolls_payPeriodStart_payPeriodEnd_idx" ON "public"."payrolls"("payPeriodStart", "payPeriodEnd");

-- CreateIndex
CREATE INDEX "payroll_entries_payrollId_idx" ON "public"."payroll_entries"("payrollId");

-- CreateIndex
CREATE INDEX "payroll_entries_employeeId_idx" ON "public"."payroll_entries"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_entries_payrollId_employeeId_key" ON "public"."payroll_entries"("payrollId", "employeeId");

-- CreateIndex
CREATE INDEX "salary_adjustments_employeeId_idx" ON "public"."salary_adjustments"("employeeId");

-- CreateIndex
CREATE INDEX "salary_adjustments_effectiveDate_idx" ON "public"."salary_adjustments"("effectiveDate");

-- CreateIndex
CREATE INDEX "salary_adjustments_adjustmentType_idx" ON "public"."salary_adjustments"("adjustmentType");

-- CreateIndex
CREATE UNIQUE INDEX "employee_expenses_reimbursementTransactionId_key" ON "public"."employee_expenses"("reimbursementTransactionId");

-- CreateIndex
CREATE INDEX "employee_expenses_employeeId_idx" ON "public"."employee_expenses"("employeeId");

-- CreateIndex
CREATE INDEX "employee_expenses_status_idx" ON "public"."employee_expenses"("status");

-- CreateIndex
CREATE INDEX "employee_expenses_expenseDate_idx" ON "public"."employee_expenses"("expenseDate");

-- CreateIndex
CREATE INDEX "employee_expenses_category_idx" ON "public"."employee_expenses"("category");

-- CreateIndex
CREATE INDEX "pto_requests_employeeId_idx" ON "public"."pto_requests"("employeeId");

-- CreateIndex
CREATE INDEX "pto_requests_status_idx" ON "public"."pto_requests"("status");

-- CreateIndex
CREATE INDEX "pto_requests_startDate_endDate_idx" ON "public"."pto_requests"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "pto_balances_employeeId_key" ON "public"."pto_balances"("employeeId");

-- CreateIndex
CREATE INDEX "pto_balances_year_idx" ON "public"."pto_balances"("year");

-- CreateIndex
CREATE UNIQUE INDEX "pto_balances_employeeId_year_key" ON "public"."pto_balances"("employeeId", "year");

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_revisions" ADD CONSTRAINT "document_revisions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_revisions" ADD CONSTRAINT "document_revisions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales" ADD CONSTRAINT "sales_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales" ADD CONSTRAINT "sales_soldBy_fkey" FOREIGN KEY ("soldBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bank_accounts" ADD CONSTRAINT "bank_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."transaction_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "public"."payrolls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bank_balances" ADD CONSTRAINT "bank_balances_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."magic_tokens" ADD CONSTRAINT "magic_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_trail" ADD CONSTRAINT "audit_trail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_templates" ADD CONSTRAINT "notification_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_rules" ADD CONSTRAINT "notification_rules_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."notification_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_rules" ADD CONSTRAINT "notification_rules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "public"."notification_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_categories" ADD CONSTRAINT "product_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."costs" ADD CONSTRAINT "costs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."costs" ADD CONSTRAINT "costs_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."costs" ADD CONSTRAINT "costs_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."costs" ADD CONSTRAINT "costs_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."costs" ADD CONSTRAINT "costs_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "public"."bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."costs" ADD CONSTRAINT "costs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cost_lines" ADD CONSTRAINT "cost_lines_costId_fkey" FOREIGN KEY ("costId") REFERENCES "public"."costs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cost_lines" ADD CONSTRAINT "cost_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cost_lines" ADD CONSTRAINT "cost_lines_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_costId_fkey" FOREIGN KEY ("costId") REFERENCES "public"."costs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."locations" ADD CONSTRAINT "locations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_moves" ADD CONSTRAINT "inventory_moves_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_moves" ADD CONSTRAINT "inventory_moves_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_moves" ADD CONSTRAINT "inventory_moves_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_moves" ADD CONSTRAINT "inventory_moves_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bom_components" ADD CONSTRAINT "bom_components_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bom_components" ADD CONSTRAINT "bom_components_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_orders" ADD CONSTRAINT "work_orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_orders" ADD CONSTRAINT "work_orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_orders" ADD CONSTRAINT "work_orders_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_orders" ADD CONSTRAINT "work_orders_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_order_components" ADD CONSTRAINT "work_order_components_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "public"."work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_order_components" ADD CONSTRAINT "work_order_components_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cost_transaction_links" ADD CONSTRAINT "cost_transaction_links_costId_fkey" FOREIGN KEY ("costId") REFERENCES "public"."costs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cost_transaction_links" ADD CONSTRAINT "cost_transaction_links_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cost_transaction_links" ADD CONSTRAINT "cost_transaction_links_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payrolls" ADD CONSTRAINT "payrolls_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payrolls" ADD CONSTRAINT "payrolls_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_entries" ADD CONSTRAINT "payroll_entries_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "public"."payrolls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_entries" ADD CONSTRAINT "payroll_entries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_adjustments" ADD CONSTRAINT "salary_adjustments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_adjustments" ADD CONSTRAINT "salary_adjustments_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_expenses" ADD CONSTRAINT "employee_expenses_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_expenses" ADD CONSTRAINT "employee_expenses_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_expenses" ADD CONSTRAINT "employee_expenses_reimbursementTransactionId_fkey" FOREIGN KEY ("reimbursementTransactionId") REFERENCES "public"."transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pto_requests" ADD CONSTRAINT "pto_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pto_requests" ADD CONSTRAINT "pto_requests_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pto_balances" ADD CONSTRAINT "pto_balances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

