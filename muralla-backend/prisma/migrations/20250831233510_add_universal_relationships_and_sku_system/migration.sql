/*
  Warnings:

  - You are about to drop the column `productType` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "productType";

-- DropEnum
DROP TYPE "public"."ProductTypeDetail";

-- CreateTable
CREATE TABLE "public"."entity_relationships" (
    "id" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "strength" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 1,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdBy" TEXT,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "relationshipHistory" JSONB,
    "lastInteractionAt" TIMESTAMP(3),
    "interactionCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "entity_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."relationship_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "sourceTypes" TEXT[],
    "targetTypes" TEXT[],
    "isBidirectional" BOOLEAN NOT NULL DEFAULT false,
    "reverseTypeName" TEXT,
    "defaultStrength" INTEGER NOT NULL DEFAULT 1,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "icon" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relationship_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."entity_skus" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "skuValue" TEXT NOT NULL,
    "templateId" TEXT,
    "components" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "tenantId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entity_skus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sku_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "components" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "validationRules" JSONB,
    "exampleOutput" TEXT,
    "tenantId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "sku_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "entity_relationships_sourceType_sourceId_idx" ON "public"."entity_relationships"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "entity_relationships_targetType_targetId_idx" ON "public"."entity_relationships"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "entity_relationships_relationshipType_idx" ON "public"."entity_relationships"("relationshipType");

-- CreateIndex
CREATE INDEX "entity_relationships_strength_idx" ON "public"."entity_relationships"("strength");

-- CreateIndex
CREATE INDEX "entity_relationships_isActive_idx" ON "public"."entity_relationships"("isActive");

-- CreateIndex
CREATE INDEX "entity_relationships_createdAt_idx" ON "public"."entity_relationships"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "entity_relationships_sourceType_sourceId_targetType_targetI_key" ON "public"."entity_relationships"("sourceType", "sourceId", "targetType", "targetId", "relationshipType");

-- CreateIndex
CREATE UNIQUE INDEX "relationship_types_name_key" ON "public"."relationship_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "entity_skus_skuValue_key" ON "public"."entity_skus"("skuValue");

-- CreateIndex
CREATE INDEX "entity_skus_entityType_entityId_idx" ON "public"."entity_skus"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "entity_skus_skuValue_idx" ON "public"."entity_skus"("skuValue");

-- CreateIndex
CREATE INDEX "entity_skus_templateId_idx" ON "public"."entity_skus"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "entity_skus_entityType_entityId_key" ON "public"."entity_skus"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "sku_templates_name_key" ON "public"."sku_templates"("name");

-- AddForeignKey
ALTER TABLE "public"."entity_skus" ADD CONSTRAINT "entity_skus_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."sku_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
