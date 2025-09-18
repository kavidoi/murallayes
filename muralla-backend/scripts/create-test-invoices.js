#!/usr/bin/env node
/**
 * Create test invoices directly in the database
 * This will populate the invoice list in the UI
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestInvoices() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('Creating Test Invoices');
  console.log('═══════════════════════════════════════════════════════');

  try {
    // Create sample Boletas
    const boleta1 = await prisma.taxDocument.create({
      data: {
        type: 'BOLETA',
        documentCode: 39,
        folio: 'B-2024-001',
        status: 'ACCEPTED',
        emitterRUT: '78188363-8',
        emitterName: 'MURALLA SPA',
        receiverRUT: '11111111-1',
        receiverName: 'Cliente Ejemplo 1',
        netAmount: 10000,
        taxAmount: 1900,
        totalAmount: 11900,
        issuedAt: new Date('2024-01-15'),
        notes: 'Boleta de prueba',
        items: {
          create: [
            {
              description: 'Café Americano',
              quantity: 2,
              unitPrice: 2500,
              net: 5000,
              tax: 950,
              total: 5950
            },
            {
              description: 'Sandwich',
              quantity: 1,
              unitPrice: 5000,
              net: 5000,
              tax: 950,
              total: 5950
            }
          ]
        }
      }
    });
    console.log(`✅ Created Boleta: ${boleta1.folio}`);

    const boleta2 = await prisma.taxDocument.create({
      data: {
        type: 'BOLETA',
        documentCode: 39,
        folio: 'B-2024-002',
        status: 'ISSUED',
        emitterRUT: '78188363-8',
        emitterName: 'MURALLA SPA',
        receiverRUT: '22222222-2',
        receiverName: 'Cliente Ejemplo 2',
        netAmount: 25000,
        taxAmount: 4750,
        totalAmount: 29750,
        issuedAt: new Date('2024-01-16'),
        notes: 'Boleta de prueba 2',
        items: {
          create: [
            {
              description: 'Almuerzo Ejecutivo',
              quantity: 2,
              unitPrice: 12500,
              net: 25000,
              tax: 4750,
              total: 29750
            }
          ]
        }
      }
    });
    console.log(`✅ Created Boleta: ${boleta2.folio}`);

    // Create sample Facturas
    const factura1 = await prisma.taxDocument.create({
      data: {
        type: 'FACTURA',
        documentCode: 33,
        folio: 'F-2024-001',
        status: 'ACCEPTED',
        emitterRUT: '78188363-8',
        emitterName: 'MURALLA SPA',
        receiverRUT: '76123456-7',
        receiverName: 'Empresa Ejemplo SpA',
        netAmount: 100000,
        taxAmount: 19000,
        totalAmount: 119000,
        issuedAt: new Date('2024-01-10'),
        notes: 'Factura de servicios',
        items: {
          create: [
            {
              description: 'Servicio de Catering Empresarial',
              quantity: 1,
              unitPrice: 100000,
              net: 100000,
              tax: 19000,
              total: 119000
            }
          ]
        }
      }
    });
    console.log(`✅ Created Factura: ${factura1.folio}`);

    const factura2 = await prisma.taxDocument.create({
      data: {
        type: 'FACTURA',
        documentCode: 33,
        folio: 'F-2024-002',
        status: 'DRAFT',
        emitterRUT: '78188363-8',
        emitterName: 'MURALLA SPA',
        receiverRUT: '76789012-3',
        receiverName: 'Otra Empresa Ltda',
        netAmount: 50000,
        taxAmount: 9500,
        totalAmount: 59500,
        issuedAt: new Date('2024-01-20'),
        notes: 'Factura en borrador',
        items: {
          create: [
            {
              description: 'Insumos de Cafetería',
              quantity: 10,
              unitPrice: 5000,
              net: 50000,
              tax: 9500,
              total: 59500
            }
          ]
        }
      }
    });
    console.log(`✅ Created Factura: ${factura2.folio}`);

    // Create a rejected document for variety
    const rejected = await prisma.taxDocument.create({
      data: {
        type: 'BOLETA',
        documentCode: 39,
        folio: 'B-2024-003',
        status: 'REJECTED',
        emitterRUT: '78188363-8',
        emitterName: 'MURALLA SPA',
        receiverRUT: '33333333-3',
        receiverName: 'Cliente Rechazado',
        netAmount: 5000,
        taxAmount: 950,
        totalAmount: 5950,
        issuedAt: new Date('2024-01-18'),
        notes: 'Documento rechazado por SII',
        items: {
          create: [
            {
              description: 'Producto Test',
              quantity: 1,
              unitPrice: 5000,
              net: 5000,
              tax: 950,
              total: 5950
            }
          ]
        }
      }
    });
    console.log(`✅ Created Rejected Boleta: ${rejected.folio}`);

    // Count total documents
    const totalDocs = await prisma.taxDocument.count();
    console.log(`\n📊 Total documents in database: ${totalDocs}`);

    // Show summary by type
    const boletas = await prisma.taxDocument.count({ where: { type: 'BOLETA' } });
    const facturas = await prisma.taxDocument.count({ where: { type: 'FACTURA' } });

    console.log(`   - Boletas: ${boletas}`);
    console.log(`   - Facturas: ${facturas}`);

    // Show summary by status
    const acceptedCount = await prisma.taxDocument.count({ where: { status: 'ACCEPTED' } });
    const issuedCount = await prisma.taxDocument.count({ where: { status: 'ISSUED' } });
    const draftCount = await prisma.taxDocument.count({ where: { status: 'DRAFT' } });
    const rejectedCount = await prisma.taxDocument.count({ where: { status: 'REJECTED' } });

    console.log(`\n📈 By Status:`);
    console.log(`   - Accepted: ${acceptedCount}`);
    console.log(`   - Issued: ${issuedCount}`);
    console.log(`   - Draft: ${draftCount}`);
    console.log(`   - Rejected: ${rejectedCount}`);

    console.log('\n✅ Test invoices created successfully!');
    console.log('Now check https://admin.murallacafe.cl/finance/invoicing');
    console.log('You should see the documents in the list.');

  } catch (error) {
    console.error('❌ Error creating test invoices:', error);
    console.error('Details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestInvoices();