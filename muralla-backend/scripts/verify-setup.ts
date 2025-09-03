#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySetup() {
  try {
    console.log('🔍 Verifying Universal Interconnection System setup...\n');

    // Check relationship types
    const relationshipTypesCount = await prisma.relationshipType.count();
    const relationshipTypes = await prisma.relationshipType.findMany({
      select: { name: true, displayName: true, isSystem: true },
      take: 10
    });

    console.log(`📋 Relationship Types: ${relationshipTypesCount} total`);
    console.log('Sample types:');
    relationshipTypes.forEach(type => {
      console.log(`  - ${type.name} (${type.displayName}) ${type.isSystem ? '[SYSTEM]' : '[CUSTOM]'}`);
    });
    console.log();

    // Check SKU templates
    const skuTemplatesCount = await prisma.sKUTemplate.count();
    const skuTemplates = await prisma.sKUTemplate.findMany({
      select: { name: true, entityType: true, isDefault: true },
    });

    console.log(`🏷️  SKU Templates: ${skuTemplatesCount} total`);
    console.log('Available templates:');
    skuTemplates.forEach(template => {
      console.log(`  - ${template.name} (${template.entityType}) ${template.isDefault ? '[DEFAULT]' : ''}`);
    });
    console.log();

    // Check existing relationships
    const existingRelationshipsCount = await prisma.entityRelationship.count();
    console.log(`🔗 Existing Relationships: ${existingRelationshipsCount} total`);
    
    if (existingRelationshipsCount > 0) {
      const sampleRelationships = await prisma.entityRelationship.findMany({
        take: 5,
        select: {
          relationshipType: true,
          sourceType: true,
          targetType: true,
          strength: true,
        }
      });
      console.log('Sample relationships:');
      sampleRelationships.forEach(rel => {
        console.log(`  - ${rel.sourceType} --[${rel.relationshipType}]--> ${rel.targetType} (strength: ${rel.strength})`);
      });
    } else {
      console.log('  No existing relationships (this is normal for new setup)');
    }
    console.log();

    // Check entity SKUs
    const existingSKUsCount = await prisma.entitySKU.count();
    console.log(`🔢 Existing SKUs: ${existingSKUsCount} total`);
    if (existingSKUsCount > 0) {
      const sampleSKUs = await prisma.entitySKU.findMany({
        take: 5,
        select: { entityType: true, skuValue: true }
      });
      console.log('Sample SKUs:');
      sampleSKUs.forEach(sku => {
        console.log(`  - ${sku.entityType}: ${sku.skuValue}`);
      });
    } else {
      console.log('  No existing SKUs (SKUs will be generated as needed)');
    }
    console.log();

    console.log('✅ Universal Interconnection System is properly set up and ready to use!');
    console.log('\n🚀 You can now:');
    console.log('1. Use @ mentions in text fields to create relationships');
    console.log('2. Generate SKUs for entities using the templates');
    console.log('3. Create manual relationships between entities');
    console.log('4. View relationship analytics and insights');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifySetup()
  .catch((e) => {
    console.error('💥 Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });