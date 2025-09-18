#!/usr/bin/env node
/**
 * Import received documents from OpenFactura to local database
 * These are invoices FROM suppliers (your costs/purchases)
 */

const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();
const API_KEY = process.env.OPENFACTURA_API_KEY || '717c541483da4406af113850262ca09c';
const BASE_URL = process.env.OPENFACTURA_BASE_URL || 'https://api.haulmer.com';

console.log('═══════════════════════════════════════════════════════');
console.log('Import Received Documents from OpenFactura');
console.log('═══════════════════════════════════════════════════════');

// Helper to make POST request
function fetchReceivedDocuments(page = 1, filters = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      Page: page.toString(),
      ...filters
    });

    const urlObj = new URL(`${BASE_URL}/v2/dte/document/received`);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'accept': 'application/json',
        'content-type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(payload);
    req.end();
  });
}

// Map document type codes to our enum
function mapDocumentType(code) {
  switch (code) {
    case 33: return 'FACTURA';
    case 39: return 'BOLETA';
    case 61: return 'CREDIT_NOTE';
    case 56: return 'NOTA_DEBITO';
    default: return 'FACTURA'; // Default to factura for other types
  }
}

// Map payment status
function mapStatus(acuses) {
  if (!acuses || acuses.length === 0) return 'ISSUED';
  const lastAcuse = acuses[acuses.length - 1];

  switch (lastAcuse.codEvento) {
    case 'ACD': return 'ACCEPTED';
    case 'RCD': return 'REJECTED';
    case 'PAG': return 'ACCEPTED'; // Paid
    case 'ERM': return 'ACCEPTED'; // Receipt confirmed
    default: return 'ISSUED';
  }
}

async function importDocuments() {
  try {
    let totalImported = 0;
    let totalSkipped = 0;
    let currentPage = 1;
    let hasMorePages = true;

    // Get documents from last 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const dateFilter = sixtyDaysAgo.toISOString().split('T')[0];

    console.log(`Fetching documents from ${dateFilter} onwards...\n`);

    while (hasMorePages && currentPage <= 5) { // Limit to 5 pages for safety
      console.log(`📄 Fetching page ${currentPage}...`);

      const response = await fetchReceivedDocuments(currentPage, {
        FchEmis: { gte: dateFilter }
      });

      if (response.status !== 200 || !response.data.data) {
        console.log('No more documents or error occurred');
        break;
      }

      const { data: documents, current_page, last_page, total } = response.data;

      console.log(`Found ${documents.length} documents on page ${current_page}/${last_page} (Total: ${total})`);

      for (const doc of documents) {
        try {
          // Check if document already exists
          const existing = await prisma.taxDocument.findFirst({
            where: {
              folio: doc.Folio?.toString(),
              emitterRUT: `${doc.RUTEmisor}-${doc.DV}`,
              type: mapDocumentType(doc.TipoDTE)
            }
          });

          if (existing) {
            console.log(`  ⏭️ Skipping ${doc.Folio} - already exists`);
            totalSkipped++;
            continue;
          }

          // Create new document
          const created = await prisma.taxDocument.create({
            data: {
              type: mapDocumentType(doc.TipoDTE),
              documentCode: doc.TipoDTE,
              folio: doc.Folio?.toString(),
              status: mapStatus(doc.Acuses),
              emitterRUT: `${doc.RUTEmisor}-${doc.DV}`,
              emitterName: doc.RznSoc,
              receiverRUT: '78188363-8', // Your RUT
              receiverName: 'MURALLA SPA',
              netAmount: doc.MntNeto || 0,
              taxAmount: doc.IVA || 0,
              totalAmount: doc.MntTotal || 0,
              issuedAt: doc.FchEmis ? new Date(doc.FchEmis) : null,
              notes: `Imported from OpenFactura. Payment: ${doc.FmaPago === '1' ? 'Contado' : doc.FmaPago === '2' ? 'Crédito' : 'Unknown'}`,
              rawResponse: doc,
              // If it's a purchase, we might want to link it to a Cost record
              // This would require matching by amount/date/supplier
              items: {
                create: [{
                  description: `${doc.RznSoc} - ${mapDocumentType(doc.TipoDTE)} ${doc.Folio}`,
                  quantity: 1,
                  unitPrice: doc.MntNeto || doc.MntTotal || 0,
                  net: doc.MntNeto || 0,
                  tax: doc.IVA || 0,
                  total: doc.MntTotal || 0,
                  taxExempt: doc.MntExe > 0
                }]
              }
            },
            include: { items: true }
          });

          console.log(`  ✅ Imported ${created.type} ${created.folio} from ${created.emitterName}`);
          totalImported++;

        } catch (err) {
          console.error(`  ❌ Error importing ${doc.Folio}:`, err.message);
        }
      }

      // Check if there are more pages
      hasMorePages = current_page < last_page;
      currentPage++;

      // Small delay to avoid rate limiting
      if (hasMorePages) {
        console.log('Waiting 2 seconds before next page...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('IMPORT COMPLETE');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Documents imported: ${totalImported}`);
    console.log(`⏭️ Documents skipped (already exist): ${totalSkipped}`);

    // Show summary of all documents
    const totals = await prisma.taxDocument.groupBy({
      by: ['type', 'status'],
      _count: true
    });

    console.log('\n📊 Database Summary:');
    totals.forEach(t => {
      console.log(`  ${t.type} (${t.status}): ${t._count}`);
    });

    const grandTotal = await prisma.taxDocument.count();
    console.log(`\n📄 Total documents in database: ${grandTotal}`);

    console.log('\n✅ Documents are now available at:');
    console.log('   https://admin.murallacafe.cl/finance/invoicing');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run import
importDocuments();