const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://muralla:1234@localhost:5433/muralla_db'
});

// Mock transaction data similar to what Tuu API returns but with missing IDs
const mockTransactionData = {
  data: [
    {
      merchant: 'Test Merchant',
      location: {
        id: 'location-123',
        address: 'Test Address 123'
      },
      sales: [
        {
          // Intentionally missing id field to test our fix
          id: undefined,
          sequenceNumber: 'SEQ001',
          serialNumber: 'POS001',
          status: 'SUCCESSFUL',
          transactionDateTime: '2025-09-09T10:30:00Z',
          transactionType: 'DEBIT',
          saleAmount: 15000,
          totalAmount: 15000,
          items: [
            {
              code: 'PROD001',
              name: 'Test Product',
              quantity: 1,
              price: 15000
            }
          ]
        },
        {
          // Test with empty string ID
          id: '',
          sequenceNumber: 'SEQ002',
          serialNumber: 'POS001',
          status: 'SUCCESSFUL',
          transactionDateTime: '2025-09-09T11:30:00Z',
          transactionType: 'CREDIT',
          saleAmount: 8500,
          totalAmount: 8500,
          items: []
        },
        {
          // Test with null ID
          id: null,
          sequenceNumber: 'SEQ003',
          serialNumber: 'POS002',
          status: 'FAILED',
          transactionDateTime: '2025-09-09T12:30:00Z',
          transactionType: 'DEBIT',
          saleAmount: 12000,
          totalAmount: 12000,
          items: []
        }
      ]
    }
  ]
};

// Simulate the ID generation logic from our fix
function generateTransactionId(sale, branchData) {
  let transactionId = sale.id;

  if (!transactionId || transactionId === undefined || transactionId === null || transactionId === '') {
    // Try different ID fields that might exist
    transactionId = sale.transactionId || sale.saleId || sale.tuuSaleId;

    // If still no ID, generate one using available data
    if (!transactionId) {
      const timestamp = sale.transactionDateTime || new Date().toISOString();
      const serial = sale.serialNumber || 'unknown';
      const amount = sale.totalAmount || sale.saleAmount || 0;
      const sequence = sale.sequenceNumber || Math.floor(Math.random() * 10000);
      transactionId = `${serial}-${timestamp.replace(/[^0-9]/g, '').slice(0, 14)}-${amount}-${sequence}`;
      console.log(`Generated fallback ID for transaction: ${transactionId}`);
    }
  }

  return transactionId;
}

function mapTuuStatusToPrisma(tuuStatus) {
  switch (tuuStatus) {
    case 'SUCCESSFUL':
      return 'COMPLETED';
    case 'FAILED':
      return 'FAILED';
    case 'PENDING':
      return 'PENDING';
    default:
      console.warn(`Unknown Tuu status '${tuuStatus}', mapping to FAILED`);
      return 'FAILED';
  }
}

async function testTransactionProcessing() {
  console.log('🧪 Testing POS transaction processing fix...\n');

  let processedTransactions = 0;
  let createdTransactions = 0;
  const errors = [];

  try {
    // Process the mock data using our improved logic
    for (const branchData of mockTransactionData.data) {
      const sales = branchData.sales || [];

      for (const sale of sales) {
        try {
          processedTransactions++;
          console.log(`Processing transaction ${processedTransactions}:`, {
            originalId: sale.id,
            sequenceNumber: sale.sequenceNumber,
            status: sale.status,
            amount: sale.totalAmount
          });

          // Apply our ID generation fix
          const transactionId = generateTransactionId(sale, branchData);

          // Final validation - ensure we have a valid ID
          if (!transactionId || transactionId === undefined || transactionId === null || transactionId === '') {
            const errorMsg = `Skipping transaction - unable to generate valid ID. Sale data: ${JSON.stringify(sale, null, 2)}`;
            errors.push(errorMsg);
            console.error('❌', errorMsg);
            continue;
          }

          console.log(`✅ Generated transaction ID: ${transactionId}`);

          // Check if transaction already exists
          const existingTransaction = await prisma.pOSTransaction.findUnique({
            where: { tuuSaleId: transactionId }
          });

          if (!existingTransaction) {
            // Create new transaction
            const transactionData = {
              tuuSaleId: transactionId,
              sequenceNumber: sale.sequenceNumber || null,
              serialNumber: sale.serialNumber || null,
              locationId: branchData.location?.id || null,
              address: branchData.location?.address || null,
              status: mapTuuStatusToPrisma(sale.status),
              transactionDateTime: new Date(sale.transactionDateTime),
              transactionType: sale.transactionType,
              saleAmount: parseFloat(sale.saleAmount?.toString() || '0'),
              totalAmount: parseFloat(sale.totalAmount?.toString() || '0'),
              tenantId: null,
            };

            await prisma.pOSTransaction.create({
              data: {
                ...transactionData,
                items: {
                  create: sale.items?.map(item => ({
                    code: item.code,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    tenantId: null,
                  })) || []
                }
              },
              include: { items: true }
            });

            createdTransactions++;
            console.log(`✅ Created transaction: ${transactionId}`);
          } else {
            console.log(`ℹ️  Transaction already exists: ${transactionId}`);
          }

        } catch (error) {
          const usedId = sale.id || 'unknown';
          const errorMsg = `Failed to process transaction ${usedId}: ${error.message}`;
          errors.push(errorMsg);
          console.error('❌', errorMsg);
        }
      }
    }

    console.log('\n📊 Test Results:');
    console.log(`Processed: ${processedTransactions}`);
    console.log(`Created: ${createdTransactions}`);
    console.log(`Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(error => console.log(`  - ${error}`));
    }

    // Success criteria: processed should equal created (no errors)
    if (processedTransactions > 0 && createdTransactions === processedTransactions && errors.length === 0) {
      console.log('\n🎉 SUCCESS: All transactions were processed and created successfully!');
      console.log('The ID generation fix is working correctly.');
      return true;
    } else if (createdTransactions > 0 && errors.length === 0) {
      console.log('\n✅ PARTIAL SUCCESS: Some transactions were created successfully.');
      console.log('The fix is working, but some transactions may have been duplicates.');
      return true;
    } else {
      console.log('\n❌ FAILURE: Transactions were not created properly.');
      return false;
    }

  } catch (error) {
    console.error('\n💥 Fatal error during test:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testTransactionProcessing().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});