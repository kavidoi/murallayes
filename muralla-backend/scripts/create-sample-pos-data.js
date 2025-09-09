#!/usr/bin/env node

/**
 * Create sample POS transactions to test real OpenFactura emission
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSamplePOSData() {
  try {
    console.log('🚀 Creating sample POS transactions for OpenFactura testing...');

    // Create sample POS transactions
    const transactions = await Promise.all([
      // Transaction 1: Coffee & pastry
      prisma.pOSTransaction.create({
        data: {
          tuuSaleId: `test-${Date.now()}-001`,
          sequenceNumber: '000001',
          locationId: 'store-001',
          address: 'Av. Providencia 123, Santiago',
          status: 'COMPLETED',
          transactionDateTime: new Date(),
          transactionType: 'DEBIT',
          documentType: 39,
          cardBrand: 'VISA',
          cardOrigin: 'Nacional',
          saleAmount: 8500.00,
          tipAmount: 500.00,
          totalAmount: 9000.00,
          currencyCode: 'CLP',
          installmentCount: 1,
          items: {
            create: [
              {
                name: 'Café Americano Grande',
                quantity: 2,
                price: 3500.00
              },
              {
                name: 'Croissant de Jamón y Queso',
                quantity: 1,
                price: 1500.00
              }
            ]
          }
        },
        include: {
          items: true
        }
      }),

      // Transaction 2: Lunch combo
      prisma.pOSTransaction.create({
        data: {
          tuuSaleId: `test-${Date.now()}-002`,
          sequenceNumber: '000002',
          locationId: 'store-001',
          address: 'Av. Providencia 123, Santiago',
          status: 'COMPLETED',
          transactionDateTime: new Date(Date.now() - 3600000), // 1 hour ago
          transactionType: 'CREDIT',
          documentType: 39,
          cardBrand: 'MASTERCARD',
          cardOrigin: 'Nacional',
          saleAmount: 15500.00,
          tipAmount: 0.00,
          totalAmount: 15500.00,
          currencyCode: 'CLP',
          installmentCount: 1,
          items: {
            create: [
              {
                name: 'Almuerzo Ejecutivo',
                quantity: 1,
                price: 12500.00,
              },
              {
                name: 'Jugo Natural Naranja',
                quantity: 1,
                price: 3000.00,
              }
            ]
          }
        },
        include: {
          items: true
        }
      }),

      // Transaction 3: Retail purchase
      prisma.pOSTransaction.create({
        data: {
          tuuSaleId: `test-${Date.now()}-003`,
          sequenceNumber: '000003',
          locationId: 'store-001',
          address: 'Av. Providencia 123, Santiago',
          status: 'COMPLETED',
          transactionDateTime: new Date(Date.now() - 7200000), // 2 hours ago
          transactionType: 'DEBIT',
          documentType: 39,
          cardBrand: 'VISA',
          cardOrigin: 'Nacional',
          saleAmount: 45000.00,
          tipAmount: 0.00,
          totalAmount: 45000.00,
          currencyCode: 'CLP',
          installmentCount: 3,
          items: {
            create: [
              {
                name: 'Producto Retail Premium',
                quantity: 1,
                price: 45000.00
              }
            ]
          }
        },
        include: {
          items: true
        }
      })
    ]);

    console.log('✅ Created POS transactions:');
    transactions.forEach((tx, index) => {
      console.log(`   ${index + 1}. ID: ${tx.id}`);
      console.log(`      Sale: $${tx.totalAmount} CLP`);
      console.log(`      Items: ${tx.items.length}`);
      console.log(`      Sequence: ${tx.sequenceNumber}`);
      console.log();
    });

    console.log('🎯 Ready to test OpenFactura emission!');
    console.log('   Use these POS transaction IDs with the invoicing endpoints:');
    transactions.forEach((tx, index) => {
      console.log(`   ${index + 1}. POST /invoicing/boletas/from-pos/${tx.id}`);
    });

    return transactions;
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createSamplePOSData().catch(console.error);
}

module.exports = { createSamplePOSData };