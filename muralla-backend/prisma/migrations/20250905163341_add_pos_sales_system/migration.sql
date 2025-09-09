/*
  Warnings:

  - You are about to drop the column `brandId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `assigneeId` on the `tasks` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."POSTransactionStatus" AS ENUM ('COMPLETED', 'PENDING', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."POSSyncType" AS ENUM ('FULL_SYNC', 'INCREMENTAL', 'MANUAL', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "public"."POSSyncStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_brandId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tasks" DROP CONSTRAINT "tasks_assigneeId_fkey";

-- DropIndex
DROP INDEX "public"."tasks_assigneeId_idx";

-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "brandId";

-- AlterTable
ALTER TABLE "public"."tasks" DROP COLUMN "assigneeId";

-- CreateTable
CREATE TABLE "public"."pos_transactions" (
    "id" TEXT NOT NULL,
    "tuuSaleId" TEXT NOT NULL,
    "sequenceNumber" TEXT,
    "serialNumber" TEXT,
    "locationId" TEXT,
    "address" TEXT,
    "status" "public"."POSTransactionStatus" NOT NULL,
    "transactionDateTime" TIMESTAMP(3) NOT NULL,
    "transactionType" TEXT NOT NULL,
    "documentType" INTEGER,
    "cardBrand" TEXT,
    "cardBin" TEXT,
    "cardOrigin" TEXT,
    "cardIssuer" TEXT,
    "saleAmount" DECIMAL(12,2) NOT NULL,
    "tipAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cashbackAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'CLP',
    "installmentType" TEXT,
    "installmentCount" INTEGER NOT NULL DEFAULT 1,
    "acquirerId" TEXT,
    "instance" INTEGER,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncSource" TEXT NOT NULL DEFAULT 'TUU_BRANCH_REPORT',
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pos_transaction_items" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "linkedProductId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pos_sync_logs" (
    "id" TEXT NOT NULL,
    "syncType" "public"."POSSyncType" NOT NULL,
    "status" "public"."POSSyncStatus" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalRequested" INTEGER NOT NULL DEFAULT 0,
    "totalProcessed" INTEGER NOT NULL DEFAULT 0,
    "totalCreated" INTEGER NOT NULL DEFAULT 0,
    "totalUpdated" INTEGER NOT NULL DEFAULT 0,
    "totalSkipped" INTEGER NOT NULL DEFAULT 0,
    "totalErrors" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    "apiEndpoint" TEXT NOT NULL DEFAULT '/BranchReport/branch-report',
    "requestPayload" JSONB,
    "responseData" JSONB,
    "tenantId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pos_configurations" (
    "id" TEXT NOT NULL,
    "apiKey" TEXT,
    "baseUrl" TEXT NOT NULL DEFAULT 'https://integrations.payment.haulmer.com',
    "useRealAPI" BOOLEAN NOT NULL DEFAULT false,
    "autoSyncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "syncIntervalHours" INTEGER NOT NULL DEFAULT 24,
    "maxDaysToSync" INTEGER NOT NULL DEFAULT 60,
    "retentionDays" INTEGER NOT NULL DEFAULT 365,
    "defaultLocationId" TEXT,
    "merchantName" TEXT,
    "partnerId" TEXT,
    "lastSuccessfulSync" TIMESTAMP(3),
    "lastSyncAttempt" TIMESTAMP(3),
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "tenantId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_TransactionSyncLogs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TransactionSyncLogs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "pos_transactions_tuuSaleId_key" ON "public"."pos_transactions"("tuuSaleId");

-- CreateIndex
CREATE INDEX "pos_transactions_tuuSaleId_idx" ON "public"."pos_transactions"("tuuSaleId");

-- CreateIndex
CREATE INDEX "pos_transactions_transactionDateTime_idx" ON "public"."pos_transactions"("transactionDateTime");

-- CreateIndex
CREATE INDEX "pos_transactions_status_idx" ON "public"."pos_transactions"("status");

-- CreateIndex
CREATE INDEX "pos_transactions_serialNumber_idx" ON "public"."pos_transactions"("serialNumber");

-- CreateIndex
CREATE INDEX "pos_transactions_locationId_idx" ON "public"."pos_transactions"("locationId");

-- CreateIndex
CREATE INDEX "pos_transactions_syncedAt_idx" ON "public"."pos_transactions"("syncedAt");

-- CreateIndex
CREATE INDEX "pos_transaction_items_transactionId_idx" ON "public"."pos_transaction_items"("transactionId");

-- CreateIndex
CREATE INDEX "pos_transaction_items_linkedProductId_idx" ON "public"."pos_transaction_items"("linkedProductId");

-- CreateIndex
CREATE INDEX "pos_sync_logs_status_idx" ON "public"."pos_sync_logs"("status");

-- CreateIndex
CREATE INDEX "pos_sync_logs_startedAt_idx" ON "public"."pos_sync_logs"("startedAt");

-- CreateIndex
CREATE INDEX "pos_sync_logs_syncType_idx" ON "public"."pos_sync_logs"("syncType");

-- CreateIndex
CREATE UNIQUE INDEX "pos_configurations_tenantId_key" ON "public"."pos_configurations"("tenantId");

-- CreateIndex
CREATE INDEX "_TransactionSyncLogs_B_index" ON "public"."_TransactionSyncLogs"("B");

-- AddForeignKey
ALTER TABLE "public"."pos_transaction_items" ADD CONSTRAINT "pos_transaction_items_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."pos_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pos_transaction_items" ADD CONSTRAINT "pos_transaction_items_linkedProductId_fkey" FOREIGN KEY ("linkedProductId") REFERENCES "public"."products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_TransactionSyncLogs" ADD CONSTRAINT "_TransactionSyncLogs_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."pos_sync_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_TransactionSyncLogs" ADD CONSTRAINT "_TransactionSyncLogs_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."pos_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
