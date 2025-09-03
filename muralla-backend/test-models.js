const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testModels() {
  try {
    console.log('Available Prisma models:');
    const models = Object.keys(prisma);
    const filteredModels = models.filter(model => !model.startsWith('_') && !model.startsWith('$'));
    
    for (const model of filteredModels) {
      console.log(`- ${model}`);
    }
    
    console.log('\nTesting specific models:');
    
    // Test relationshipType
    try {
      const count = await prisma.relationshipType.count();
      console.log('✅ relationshipType.count():', count);
    } catch (e) {
      console.log('❌ relationshipType.count():', e.message);
    }
    
    // Test skuTemplate
    try {
      const count = await prisma.skuTemplate.count();
      console.log('✅ skuTemplate.count():', count);
    } catch (e) {
      console.log('❌ skuTemplate.count():', e.message);
    }
    
    // Test entitySku
    try {
      const count = await prisma.entitySku.count();
      console.log('✅ entitySku.count():', count);
    } catch (e) {
      console.log('❌ entitySku.count():', e.message);
    }
    
    // Test entityRelationship
    try {
      const count = await prisma.entityRelationship.count();
      console.log('✅ entityRelationship.count():', count);
    } catch (e) {
      console.log('❌ entityRelationship.count():', e.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testModels();
