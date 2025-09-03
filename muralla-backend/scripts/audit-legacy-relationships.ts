#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function auditLegacyRelationships() {
  console.log('🔍 Auditing Legacy vs Universal Relationship Systems...\n');

  try {
    // 1. Check Tasks - assigneeId vs EntityRelationship
    console.log('📋 TASK ASSIGNMENTS:');
    
    const tasksWithLegacyAssignee = await prisma.task.count({
      where: { 
        assigneeId: { not: null },
        isDeleted: false 
      }
    });
    
    const taskAssignmentRelationships = await prisma.entityRelationship.count({
      where: {
        sourceType: 'Task',
        relationshipType: 'assigned_to',
        isDeleted: false
      }
    });

    console.log(`  Legacy assigneeId fields: ${tasksWithLegacyAssignee}`);
    console.log(`  Universal relationships:  ${taskAssignmentRelationships}`);
    
    // Find duplicates
    const tasksWithBoth = await prisma.$queryRaw<any[]>`
      SELECT t.id, t.title, t.assignee_id, 
             COUNT(er.id) as relationship_count
      FROM tasks t
      LEFT JOIN entity_relationships er ON er.source_type = 'Task' 
                                        AND er.source_id = t.id 
                                        AND er.relationship_type = 'assigned_to'
                                        AND er.is_deleted = false
      WHERE t.assignee_id IS NOT NULL AND t.is_deleted = false
      GROUP BY t.id, t.title, t.assignee_id
      LIMIT 5
    `;
    
    console.log(`  Tasks with both systems: ${tasksWithBoth.length > 0 ? 'YES' : 'NO'}`);
    if (tasksWithBoth.length > 0) {
      console.log('  Sample duplicates:');
      tasksWithBoth.forEach(task => {
        console.log(`    - ${task.title}: legacy=${task.assignee_id}, relationships=${task.relationship_count}`);
      });
    }
    console.log();

    // 2. Check Products - brandId vs EntityRelationship  
    console.log('🏷️  PRODUCT BRANDS:');
    
    const productsWithLegacyBrand = await prisma.product.count({
      where: { 
        brandId: { not: null },
        isDeleted: false 
      }
    });
    
    const productBrandRelationships = await prisma.entityRelationship.count({
      where: {
        sourceType: 'Product',
        relationshipType: 'brand_of',
        isDeleted: false
      }
    });

    console.log(`  Legacy brandId fields: ${productsWithLegacyBrand}`);
    console.log(`  Universal relationships: ${productBrandRelationships}`);
    console.log();

    // 3. Check Budget Lines - budgetId (this one should stay)
    console.log('💰 BUDGET LINES (Should keep legacy):');
    
    const budgetLinesWithBudgetId = await prisma.budgetLine.count({
      where: { 
        budgetId: { not: null },
        isDeleted: false 
      }
    });
    
    const budgetLineRelationships = await prisma.entityRelationship.count({
      where: {
        sourceType: 'BudgetLine',
        targetType: 'Budget',
        isDeleted: false
      }
    });

    console.log(`  Legacy budgetId fields: ${budgetLinesWithBudgetId}`);
    console.log(`  Universal relationships: ${budgetLineRelationships}`);
    console.log();

    // 4. Check what's still using legacy fields
    console.log('🔗 LEGACY FIELDS STILL IN USE:');
    
    const legacyFieldsInUse = [
      { model: 'Task', field: 'assigneeId', count: tasksWithLegacyAssignee },
      { model: 'Task', field: 'projectId', count: await prisma.task.count({ where: { projectId: { not: null }, isDeleted: false } }) },
      { model: 'Product', field: 'brandId', count: productsWithLegacyBrand },
      { model: 'BudgetLine', field: 'budgetId', count: budgetLinesWithBudgetId },
      { model: 'Comment', field: 'budgetId', count: await prisma.comment.count({ where: { budgetId: { not: null }, isDeleted: false } }) },
      { model: 'Comment', field: 'taskId', count: await prisma.comment.count({ where: { taskId: { not: null }, isDeleted: false } }) },
    ];

    legacyFieldsInUse.forEach(field => {
      const status = field.count > 0 ? '🔴 IN USE' : '✅ EMPTY';
      console.log(`  ${field.model}.${field.field}: ${field.count} records ${status}`);
    });
    console.log();

    // 5. Check total relationship count
    console.log('📊 UNIVERSAL RELATIONSHIP SYSTEM STATUS:');
    const totalRelationships = await prisma.entityRelationship.count({ where: { isDeleted: false } });
    const relationshipsByType = await prisma.entityRelationship.groupBy({
      by: ['relationshipType'],
      _count: true,
      where: { isDeleted: false },
      orderBy: { _count: { _all: 'desc' } },
      take: 10
    });

    console.log(`  Total relationships: ${totalRelationships}`);
    console.log('  Top relationship types:');
    relationshipsByType.forEach(rel => {
      console.log(`    - ${rel.relationshipType}: ${rel._count} relationships`);
    });
    console.log();

    // 6. Recommendations
    console.log('💡 RECOMMENDATIONS:');
    console.log();
    
    if (tasksWithLegacyAssignee > 0 && taskAssignmentRelationships > 0) {
      console.log('🟡 DUPLICATED TASK ASSIGNMENTS:');
      console.log('   - Both assigneeId field and EntityRelationship exist for tasks');
      console.log('   - Recommendation: Remove assigneeId field, use only EntityRelationship');
      console.log();
    }
    
    if (productsWithLegacyBrand > 0 && productBrandRelationships > 0) {
      console.log('🟡 DUPLICATED PRODUCT BRANDS:');
      console.log('   - Both brandId field and EntityRelationship exist for products');
      console.log('   - Recommendation: Remove brandId field, use only EntityRelationship');
      console.log();
    }

    const hasLegacyData = legacyFieldsInUse.some(f => f.count > 0 && !['budgetId', 'projectId', 'taskId'].includes(f.field));
    
    if (hasLegacyData) {
      console.log('🔴 LEGACY SYSTEM STILL ACTIVE:');
      console.log('   - Multiple relationship storage systems are active');
      console.log('   - Data inconsistency risk exists');
      console.log('   - Performance impact from dual systems');
      console.log();
    } else {
      console.log('✅ CLEAN UNIVERSAL SYSTEM:');
      console.log('   - Only universal relationship system is in use');
      console.log('   - No legacy relationship fields with data');
      console.log('   - Ready for production!');
      console.log();
    }

  } catch (error) {
    console.error('❌ Audit failed:', error);
    throw error;
  }
}

auditLegacyRelationships()
  .catch((e) => {
    console.error('💥 Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });