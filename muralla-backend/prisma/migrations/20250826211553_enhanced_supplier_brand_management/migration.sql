/*
  Warnings:

  - A unique constraint covering the columns `[internalNumber]` on the table `vendors` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `internalNumber` to the `vendors` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."CalendarEventType" AS ENUM ('TASK', 'MEETING', 'HOLIDAY', 'SHIFT', 'CAFE_STATUS');

-- CreateEnum
CREATE TYPE "public"."CalendarPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "public"."ShiftStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."CafeStatus" AS ENUM ('OPEN', 'CLOSED', 'LIMITED');

-- CreateEnum
CREATE TYPE "public"."VendorType" AS ENUM ('SUPPLIER', 'BRAND_CONTACT', 'AGENT');

-- CreateEnum
CREATE TYPE "public"."POStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'ORDERED', 'PARTIALLY_DELIVERED', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "brandId" TEXT,
ADD COLUMN     "brandName" TEXT,
ADD COLUMN     "pedidosyaLastSync" TIMESTAMP(3),
ADD COLUMN     "rappiLastSync" TIMESTAMP(3),
ADD COLUMN     "uberLastSync" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."tasks" ADD COLUMN     "dueDateModifiedAt" TIMESTAMP(3),
ADD COLUMN     "statusModifiedByUser" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wasEnProgreso" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."vendors" ADD COLUMN     "brandContactId" TEXT,
ADD COLUMN     "internalNumber" TEXT NOT NULL,
ADD COLUMN     "vendorType" "public"."VendorType" NOT NULL DEFAULT 'SUPPLIER';

-- CreateTable
CREATE TABLE "public"."calendar_events" (
    "id" TEXT NOT NULL,
    "type" "public"."CalendarEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "location" TEXT,
    "attendees" TEXT[],
    "assignedTo" TEXT,
    "priority" "public"."CalendarPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."EventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "color" TEXT,
    "createdBy" TEXT NOT NULL,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringType" TEXT,
    "recurringInterval" INTEGER,
    "recurringEndDate" TIMESTAMP(3),
    "parentEventId" TEXT,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff_shifts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "status" "public"."ShiftStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cafe_schedules" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "public"."CafeStatus" NOT NULL,
    "openTime" TEXT,
    "closeTime" TEXT,
    "specialReason" TEXT,
    "specialOpen" TEXT,
    "specialClose" TEXT,
    "notes" TEXT,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cafe_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."brand_contacts" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_orders" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "mainSupplierId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "expectedDelivery" TIMESTAMP(3),
    "status" "public"."POStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "shippingCost" DECIMAL(12,2),
    "taxAmount" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CLP',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_order_lines" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitCost" DECIMAL(12,4) NOT NULL,
    "totalCost" DECIMAL(12,2) NOT NULL,
    "shippingCostUnit" DECIMAL(12,4),
    "subSupplierId" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "trackingNumber" TEXT,

    CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_order_sub_suppliers" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "subSupplierId" TEXT NOT NULL,
    "shippingCost" DECIMAL(12,2),
    "deliveryDate" TIMESTAMP(3),
    "trackingNumber" TEXT,
    "notes" TEXT,

    CONSTRAINT "purchase_order_sub_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendar_events_startTime_idx" ON "public"."calendar_events"("startTime");

-- CreateIndex
CREATE INDEX "calendar_events_endTime_idx" ON "public"."calendar_events"("endTime");

-- CreateIndex
CREATE INDEX "calendar_events_type_idx" ON "public"."calendar_events"("type");

-- CreateIndex
CREATE INDEX "calendar_events_createdBy_idx" ON "public"."calendar_events"("createdBy");

-- CreateIndex
CREATE INDEX "calendar_events_assignedTo_idx" ON "public"."calendar_events"("assignedTo");

-- CreateIndex
CREATE INDEX "staff_shifts_userId_idx" ON "public"."staff_shifts"("userId");

-- CreateIndex
CREATE INDEX "staff_shifts_date_idx" ON "public"."staff_shifts"("date");

-- CreateIndex
CREATE INDEX "staff_shifts_status_idx" ON "public"."staff_shifts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "cafe_schedules_date_key" ON "public"."cafe_schedules"("date");

-- CreateIndex
CREATE INDEX "cafe_schedules_date_idx" ON "public"."cafe_schedules"("date");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "public"."brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_poNumber_key" ON "public"."purchase_orders"("poNumber");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_sub_suppliers_purchaseOrderId_subSupplierId_key" ON "public"."purchase_order_sub_suppliers"("purchaseOrderId", "subSupplierId");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_internalNumber_key" ON "public"."vendors"("internalNumber");

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vendors" ADD CONSTRAINT "vendors_brandContactId_fkey" FOREIGN KEY ("brandContactId") REFERENCES "public"."brand_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."calendar_events" ADD CONSTRAINT "calendar_events_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."calendar_events" ADD CONSTRAINT "calendar_events_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "public"."calendar_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_shifts" ADD CONSTRAINT "staff_shifts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."brand_contacts" ADD CONSTRAINT "brand_contacts_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_mainSupplierId_fkey" FOREIGN KEY ("mainSupplierId") REFERENCES "public"."vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_subSupplierId_fkey" FOREIGN KEY ("subSupplierId") REFERENCES "public"."vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_sub_suppliers" ADD CONSTRAINT "purchase_order_sub_suppliers_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_sub_suppliers" ADD CONSTRAINT "purchase_order_sub_suppliers_subSupplierId_fkey" FOREIGN KEY ("subSupplierId") REFERENCES "public"."vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
