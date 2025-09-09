const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupPosConfig() {
  try {
    // Check if config already exists
    const existing = await prisma.pOSConfiguration.findFirst();
    
    if (existing) {
      console.log('✅ POS configuration already exists, updating...');
      const updated = await prisma.pOSConfiguration.update({
        where: { id: existing.id },
        data: {
          apiKey: 'SxVE4TUUj3gDAQQniBWw5yxe5JM3UtSLOqbKQz9Hlb7gBwHGqkRqyyNmQCbbJ4CaWczA1zTmdlaA4frKfYxCaBeVg1hL75xdUo8h4UCgD9UQCdCqo03EW4NSM87Pb8',
          baseUrl: 'https://integrations.payment.haulmer.com',
          useRealAPI: true,
          autoSyncEnabled: true,
          syncIntervalHours: 24,
          maxDaysToSync: 60,
          retentionDays: 365,
          updatedAt: new Date()
        }
      });
      console.log('✅ Configuration updated with API key');
    } else {
      console.log('Creating new POS configuration...');
      const created = await prisma.pOSConfiguration.create({
        data: {
          apiKey: 'SxVE4TUUj3gDAQQniBWw5yxe5JM3UtSLOqbKQz9Hlb7gBwHGqkRqyyNmQCbbJ4CaWczA1zTmdlaA4frKfYxCaBeVg1hL75xdUo8h4UCgD9UQCdCqo03EW4NSM87Pb8',
          baseUrl: 'https://integrations.payment.haulmer.com',
          useRealAPI: true,
          autoSyncEnabled: true,
          syncIntervalHours: 24,
          maxDaysToSync: 60,
          retentionDays: 365,
          tenantId: null,
          isActive: true
        }
      });
      console.log('✅ POS configuration created with API key');
    }
    
    // Verify configuration
    const config = await prisma.pOSConfiguration.findFirst();
    console.log('Configuration status:', {
      hasApiKey: !!config.apiKey,
      baseUrl: config.baseUrl,
      autoSyncEnabled: config.autoSyncEnabled,
      useRealAPI: config.useRealAPI
    });
    
  } catch (error) {
    console.error('❌ Error setting up POS configuration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupPosConfig();
