#!/usr/bin/env node
/**
 * Test OpenFactura Received Documents API
 * Fetches facturas/boletas that OTHER businesses have sent to you
 */

const https = require('https');

// Configuration
const COMPANY_RUT = '78188363-8'; // Your RUT as receiver
const API_KEY = process.env.OPENFACTURA_API_KEY || '717c541483da4406af113850262ca09c';
const BASE_URL = process.env.OPENFACTURA_BASE_URL || 'https://api.haulmer.com';

console.log('═══════════════════════════════════════════════════════');
console.log('OpenFactura - Received Documents Test');
console.log('═══════════════════════════════════════════════════════');
console.log(`Your RUT (as receiver): ${COMPANY_RUT}`);
console.log(`API Key: ${API_KEY.substring(0, 8)}...`);
console.log('═══════════════════════════════════════════════════════\n');

// Helper to make POST request
function makePostRequest(endpoint, body) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${endpoint}`;
    const bodyStr = JSON.stringify(body);

    console.log(`📡 POST ${endpoint}`);
    console.log('Request body:', JSON.stringify(body, null, 2));

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'accept': 'application/json',
        'content-type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr)
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
          resolve({ status: res.statusCode, data: data, error: 'Invalid JSON' });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(bodyStr);
    req.end();
  });
}

// Helper to get date string
function getDateString(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

async function testReceivedDocuments() {
  try {
    console.log('Test 1: Get ALL Received Documents');
    console.log('────────────────────────────────────');

    // First, get all documents without filters
    const allDocsPayload = {
      "Page": "1"
    };

    const allDocs = await makePostRequest('/v2/dte/document/received', allDocsPayload);

    if (allDocs.status === 200 || allDocs.status === 201) {
      console.log('✅ Success! Received documents found');
      console.log(`Total documents: ${allDocs.data.total || 0}`);
      console.log(`Current page: ${allDocs.data.current_page || 1}`);
      console.log(`Last page: ${allDocs.data.last_page || 1}`);

      if (allDocs.data.data && allDocs.data.data.length > 0) {
        console.log(`\nShowing first ${Math.min(5, allDocs.data.data.length)} documents:\n`);

        allDocs.data.data.slice(0, 5).forEach((doc, i) => {
          console.log(`Document ${i + 1}:`);
          console.log(`  - Emisor: ${doc.RznSoc} (RUT: ${doc.RUTEmisor}-${doc.DV})`);
          console.log(`  - Type: ${getDocumentTypeName(doc.TipoDTE)} (${doc.TipoDTE})`);
          console.log(`  - Folio: ${doc.Folio}`);
          console.log(`  - Date: ${doc.FchEmis}`);
          console.log(`  - Total: $${doc.MntTotal?.toLocaleString('es-CL') || 0}`);
          console.log(`  - Status: ${doc.Acuses?.length > 0 ? doc.Acuses[0].codEvento : 'No acuse'}`);
          console.log('');
        });
      } else {
        console.log('⚠️ No documents found in response');
      }
    } else {
      console.log(`❌ Failed with status ${allDocs.status}`);
      console.log('Response:', JSON.stringify(allDocs.data, null, 2));
    }

    console.log('\nTest 2: Get Recent Facturas (last 30 days)');
    console.log('────────────────────────────────────');

    // Get only Facturas from last 30 days
    const facturasPayload = {
      "Page": "1",
      "TipoDTE": {
        "eq": "33"  // Factura Electrónica
      },
      "FchEmis": {
        "gte": getDateString(30)  // Last 30 days
      }
    };

    const facturas = await makePostRequest('/v2/dte/document/received', facturasPayload);

    if (facturas.status === 200 || facturas.status === 201) {
      console.log('✅ Facturas query successful');
      console.log(`Found ${facturas.data.total || 0} facturas in last 30 days`);

      if (facturas.data.data && facturas.data.data.length > 0) {
        console.log('\nFactura summary:');
        let totalAmount = 0;
        facturas.data.data.forEach(doc => {
          totalAmount += (doc.MntTotal || 0);
        });
        console.log(`Total amount: $${totalAmount.toLocaleString('es-CL')}`);
      }
    } else {
      console.log(`⚠️ Facturas query returned status ${facturas.status}`);
    }

    console.log('\nTest 3: Get Recent Boletas');
    console.log('────────────────────────────────────');

    // Get Boletas
    const boletasPayload = {
      "Page": "1",
      "TipoDTE": {
        "eq": "39"  // Boleta Electrónica
      },
      "FchEmis": {
        "gte": getDateString(30)
      }
    };

    const boletas = await makePostRequest('/v2/dte/document/received', boletasPayload);

    if (boletas.status === 200 || boletas.status === 201) {
      console.log('✅ Boletas query successful');
      console.log(`Found ${boletas.data.total || 0} boletas in last 30 days`);
    } else {
      console.log(`⚠️ Boletas query returned status ${boletas.status}`);
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════');

    if (allDocs.status === 200 && allDocs.data.total > 0) {
      console.log(`✅ Found ${allDocs.data.total} received documents total`);
      console.log('\n📝 These are invoices FROM your suppliers/vendors');
      console.log('   (Documents where you are the receiver)');

      // Group by type if we have data
      if (allDocs.data.data && allDocs.data.data.length > 0) {
        const byType = {};
        allDocs.data.data.forEach(doc => {
          const typeName = getDocumentTypeName(doc.TipoDTE);
          byType[typeName] = (byType[typeName] || 0) + 1;
        });

        console.log('\nDocument types on this page:');
        Object.entries(byType).forEach(([type, count]) => {
          console.log(`  - ${type}: ${count}`);
        });
      }

      console.log('\n💡 IMPLEMENTATION NOTES:');
      console.log('1. These documents represent your COSTS/PURCHASES');
      console.log('2. You can import them to track expenses');
      console.log('3. You can give "acuse" (acknowledge receipt) via the API');
      console.log('4. Perfect for expense tracking and accounting');
    } else {
      console.log('⚠️ No received documents found or API error');
      console.log('This could mean:');
      console.log('  1. No suppliers have sent you electronic documents');
      console.log('  2. Documents haven\'t been processed yet');
      console.log('  3. API permissions issue');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Helper function to get document type name
function getDocumentTypeName(code) {
  const types = {
    33: 'Factura Electrónica',
    34: 'Factura No Afecta',
    39: 'Boleta Electrónica',
    41: 'Boleta No Afecta',
    43: 'Liquidación Factura',
    46: 'Factura de Compra',
    52: 'Guía de Despacho',
    56: 'Nota de Débito',
    61: 'Nota de Crédito',
    110: 'Factura de Exportación',
    111: 'Nota de Débito Exportación',
    112: 'Nota de Crédito Exportación'
  };
  return types[code] || `Tipo ${code}`;
}

// Run tests
testReceivedDocuments();