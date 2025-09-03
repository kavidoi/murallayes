-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('supplier', 'customer', 'important', 'brand');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('business', 'person');

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ContactType" NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "instagram" TEXT,
    "rut" TEXT,
    "company" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "contactPersonName" TEXT,
    "giro" TEXT,
    "skuAbbreviation" TEXT,
    "bankDetails" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "portalToken" TEXT,
    "portalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totalPurchases" DECIMAL(12,2),
    "totalSales" DECIMAL(12,2),
    "averagePurchase" DECIMAL(12,2),
    "averageSale" DECIMAL(12,2),
    "lastPurchaseAmount" DECIMAL(12,2),
    "lastSaleAmount" DECIMAL(12,2),
    "purchaseCount" INTEGER NOT NULL DEFAULT 0,
    "salesCount" INTEGER NOT NULL DEFAULT 0,
    "relationshipScore" INTEGER NOT NULL DEFAULT 1,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastContact" TIMESTAMP(3),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);
