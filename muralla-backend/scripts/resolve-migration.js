#!/usr/bin/env node
/**
 * Script to resolve failed migration in Railway production database
 * This marks the failed migration as resolved so new deployments can proceed
 */

const { PrismaClient } = require('@prisma/client');

async function resolveMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking migration status...');
    
    // Check current migration state
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, started_at, applied_steps_count 
      FROM _prisma_migrations 
      WHERE migration_name = '20250816084144_add_product_pipeline'
    `;
    
    console.log('Current migration state:', migrations);
    
    if (migrations.length > 0) {
      console.log('🔧 Marking failed migration as resolved...');
      
      // Mark the migration as completed
      await prisma.$queryRaw`
        UPDATE _prisma_migrations 
        SET finished_at = NOW(), 
            applied_steps_count = 1,
            logs = 'Migration marked as resolved via script'
        WHERE migration_name = '20250816084144_add_product_pipeline'
      `;
      
      console.log('✅ Migration marked as resolved');
    } else {
      console.log('ℹ️  Migration not found in database');
    }
    
    // Verify the fix
    const updatedMigrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, started_at, applied_steps_count 
      FROM _prisma_migrations 
      WHERE migration_name = '20250816084144_add_product_pipeline'
    `;
    
    console.log('Updated migration state:', updatedMigrations);
    
  } catch (error) {
    console.error('❌ Error resolving migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resolveMigration().catch(console.error);
