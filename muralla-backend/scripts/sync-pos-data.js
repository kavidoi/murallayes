const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function syncPosData() {
  try {
    // Get configuration
    const config = await prisma.pOSConfiguration.findFirst();
    if (!config || !config.apiKey) {
      throw new Error('POS configuration not found or API key missing');
    }

    console.log('Starting POS sync for September 6, 2025...');

    // Create sync log
    const syncLog = await prisma.pOSSyncLog.create({
      data: {
        syncType: 'MANUAL',
        status: 'RUNNING',
        startDate: new Date('2025-09-06T00:00:00.000Z'),
        endDate: new Date('2025-09-06T23:59:59.999Z'),
        startedAt: new Date(),
        apiEndpoint: '/BranchReport/branch-report',
        tenantId: null
      }
    });

    try {
      // Call TuU API
      const response = await axios.post(
        'https://integrations.payment.haulmer.com/BranchReport/branch-report',
        {
          StartDate: '2025-09-06',
          EndDate: '2025-09-06'
        },
        {
          headers: {
            'X-API-Key': config.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data || !response.data.data) {
        throw new Error('No data received from TuU API');
      }

      const transactions = response.data.data.transactions || [];
      let createdCount = 0;
      let updatedCount = 0;
      const errors = [];

      console.log(`Processing ${transactions.length} transactions...`);

      // Process each transaction
      for (const tx of transactions) {
        try {
          // Check if transaction exists
          const existing = await prisma.pOSTransaction.findUnique({
            where: { tuuSaleId: tx.saleId }
          });

          if (!existing) {
            // Create new transaction
            await prisma.pOSTransaction.create({
              data: {
                tuuSaleId: tx.saleId,
                sequenceNumber: tx.sequenceNumber,
                serialNumber: tx.serialNumber,
                locationId: tx.locationId,
                address: tx.address,
                status: tx.status === 'completed' ? 'COMPLETED' : 'FAILED',
                transactionDateTime: new Date(tx.transactionDateTime),
                transactionType: tx.transactionType,
                documentType: tx.documentType,
                cardBrand: tx.cardBrand,
                cardBin: tx.cardBin,
                cardOrigin: tx.cardOrigin,
                cardIssuer: tx.cardIssuer,
                saleAmount: tx.saleAmount,
                tipAmount: tx.tipAmount,
                cashbackAmount: tx.cashbackAmount,
                totalAmount: tx.totalAmount,
                currencyCode: tx.currencyCode,
                installmentType: tx.installmentType,
                installmentCount: tx.installmentCount,
                acquirerId: tx.acquirerId,
                instance: tx.instance,
                syncedAt: new Date(),
                syncSource: 'MANUAL_SYNC',
                lastUpdatedAt: new Date(),
                tenantId: null,
                items: {
                  create: tx.items?.map(item => ({
                    code: item.code,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                  })) || []
                }
              }
            });
            createdCount++;
            console.log(`✅ Created transaction: ${tx.saleId}`);
          } else {
            console.log(`⏭️  Transaction already exists: ${tx.saleId}`);
          }
        } catch (error) {
          errors.push(`Failed to process transaction ${tx.saleId}: ${error.message}`);
          console.error(`❌ Error processing transaction ${tx.saleId}:`, error.message);
        }
      }

      // Update sync log with success
      await prisma.pOSSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          totalRequested: transactions.length,
          totalProcessed: transactions.length,
          totalCreated: createdCount,
          totalUpdated: updatedCount,
          totalErrors: errors.length,
          errorDetails: errors.length > 0 ? { errors } : null,
          responseData: response.data
        }
      });

      console.log(`\n✅ Sync completed successfully!`);
      console.log(`   Total transactions: ${transactions.length}`);
      console.log(`   Created: ${createdCount}`);
      console.log(`   Already existed: ${transactions.length - createdCount}`);
      console.log(`   Errors: ${errors.length}`);

    } catch (error) {
      // Update sync log with failure
      await prisma.pOSSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error.message,
          errorDetails: { error: error.message, stack: error.stack }
        }
      });
      throw error;
    }

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

syncPosData();
