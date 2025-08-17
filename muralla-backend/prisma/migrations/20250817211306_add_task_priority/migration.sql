/*
  Warnings:

  - You are about to drop the column `category` on the `products` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sku]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[mpPaymentId]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sku` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

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

-- DropIndex
DROP INDEX "public"."transactions_mpPaymentId_idx";

-- AlterTable
ALTER TABLE "public"."bank_accounts" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "category",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sku" TEXT NOT NULL,
ADD COLUMN     "type" "public"."ProductType" NOT NULL DEFAULT 'TERMINADO',
ADD COLUMN     "unitCost" DECIMAL(10,4),
ADD COLUMN     "uom" TEXT NOT NULL DEFAULT 'UN',
ALTER COLUMN "price" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."tasks" ADD COLUMN     "priority" "public"."TaskPriority" NOT NULL DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "public"."transactions" ADD COLUMN     "companyId" TEXT;

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
CREATE UNIQUE INDEX "products_sku_key" ON "public"."products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_mpPaymentId_key" ON "public"."transactions"("mpPaymentId");

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bank_accounts" ADD CONSTRAINT "bank_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
