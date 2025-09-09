-- CreateEnum
CREATE TYPE "public"."TaxDocumentType" AS ENUM ('BOLETA', 'FACTURA', 'CREDIT_NOTE');

-- CreateEnum
CREATE TYPE "public"."TaxDocumentStatus" AS ENUM ('DRAFT', 'ISSUED', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."tax_documents" (
    "id" TEXT NOT NULL,
    "type" "public"."TaxDocumentType" NOT NULL,
    "folio" TEXT,
    "documentCode" INTEGER,
    "openFacturaId" TEXT,
    "emitterRUT" TEXT,
    "emitterName" TEXT,
    "receiverRUT" TEXT,
    "receiverName" TEXT,
    "netAmount" DECIMAL(12,2),
    "taxAmount" DECIMAL(12,2),
    "totalAmount" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'CLP',
    "issuedAt" TIMESTAMP(3),
    "status" "public"."TaxDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "pdfUrl" TEXT,
    "xmlUrl" TEXT,
    "rawResponse" JSONB,
    "notes" TEXT,
    "posTransactionId" TEXT,
    "costId" TEXT,
    "tenantId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tax_document_items" (
    "id" TEXT NOT NULL,
    "taxDocumentId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "net" DECIMAL(12,2) NOT NULL,
    "tax" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "taxExempt" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_document_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tax_documents_openFacturaId_key" ON "public"."tax_documents"("openFacturaId");

-- CreateIndex
CREATE INDEX "tax_documents_type_idx" ON "public"."tax_documents"("type");

-- CreateIndex
CREATE INDEX "tax_documents_status_idx" ON "public"."tax_documents"("status");

-- CreateIndex
CREATE INDEX "tax_documents_issuedAt_idx" ON "public"."tax_documents"("issuedAt");

-- CreateIndex
CREATE INDEX "tax_documents_posTransactionId_idx" ON "public"."tax_documents"("posTransactionId");

-- CreateIndex
CREATE INDEX "tax_documents_costId_idx" ON "public"."tax_documents"("costId");

-- CreateIndex
CREATE INDEX "tax_document_items_taxDocumentId_idx" ON "public"."tax_document_items"("taxDocumentId");

-- AddForeignKey
ALTER TABLE "public"."tax_documents" ADD CONSTRAINT "tax_documents_posTransactionId_fkey" FOREIGN KEY ("posTransactionId") REFERENCES "public"."pos_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tax_documents" ADD CONSTRAINT "tax_documents_costId_fkey" FOREIGN KEY ("costId") REFERENCES "public"."costs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tax_document_items" ADD CONSTRAINT "tax_document_items_taxDocumentId_fkey" FOREIGN KEY ("taxDocumentId") REFERENCES "public"."tax_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
