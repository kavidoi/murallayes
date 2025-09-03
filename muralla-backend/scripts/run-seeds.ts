#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { seedRelationshipTypes } from '../prisma/seeds/relationship-types.seed';
import { seedSKUTemplates } from '../prisma/seeds/sku-templates.seed';
import { migrateExistingRelationships } from './migrate-existing-relationships';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Universal Interconnection System setup...\n');

  try {
    // 1. Seed relationship types
    console.log('📋 Step 1: Seeding relationship types...');
    await seedRelationshipTypes();
    console.log('✅ Relationship types seeded successfully!\n');

    // 2. Seed SKU templates
    console.log('🏷️  Step 2: Seeding SKU templates...');
    await seedSKUTemplates();
    console.log('✅ SKU templates seeded successfully!\n');

    // 3. Migrate existing relationships
    console.log('🔄 Step 3: Migrating existing relationships...');
    await migrateExistingRelationships();
    console.log('✅ Existing relationships migrated successfully!\n');

    console.log('🎉 Universal Interconnection System setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- ✅ Relationship types configured');
    console.log('- ✅ SKU templates ready');
    console.log('- ✅ Existing data migrated');
    console.log('- ✅ System ready for use');

    console.log('\n🔗 Next steps:');
    console.log('1. Start using @ mentions in comments and descriptions');
    console.log('2. Generate SKUs for your entities');
    console.log('3. Explore relationship management in the admin interface');
    console.log('4. Set up relationship-based dashboards');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('💥 Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });