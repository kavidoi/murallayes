#!/usr/bin/env ts-node

import { seedRelationshipTypes } from '../prisma/seeds/relationship-types.seed';
import { seedSKUTemplates } from '../prisma/seeds/sku-templates.seed';

async function main() {
  console.log('🚀 Starting Universal Interconnection System basic setup...\n');

  try {
    // 1. Seed relationship types
    console.log('📋 Step 1: Seeding relationship types...');
    await seedRelationshipTypes();
    console.log('✅ Relationship types seeded successfully!\n');

    // 2. Seed SKU templates
    console.log('🏷️  Step 2: Seeding SKU templates...');
    await seedSKUTemplates();
    console.log('✅ SKU templates seeded successfully!\n');

    console.log('🎉 Universal Interconnection System basic setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- ✅ Relationship types configured (25 types)');
    console.log('- ✅ SKU templates ready (8 templates)');
    console.log('- ✅ System ready for use');

    console.log('\n🔗 Next steps:');
    console.log('1. Start using @ mentions in comments and descriptions');
    console.log('2. Generate SKUs for your entities');
    console.log('3. Explore relationship management in the admin interface');
    console.log('4. Create custom relationships as needed');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('💥 Fatal error:', e);
    process.exit(1);
  });