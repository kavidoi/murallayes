#!/usr/bin/env node
/**
 * Simple OpenFactura API Test - Focused on working endpoints
 * Tests basic connectivity and document creation
 */

const https = require('https');

// Configuration
const COMPANY_RUT = '78188363-8';
const API_KEY = process.env.OPENFACTURA_API_KEY || '717c541483da4406af113850262ca09c';
const BASE_URL = 'https://api.haulmer.com';

console.log('═══════════════════════════════════════════════════════');
console.log('OpenFactura API - Simple Test');
console.log('═══════════════════════════════════════════════════════');
console.log(`Company RUT: ${COMPANY_RUT}`);
console.log(`API Key: ${API_KEY.substring(0, 8)}...`);
console.log('═══════════════════════════════════════════════════════\n');

// Helper to make requests
function makeRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`\n📡 ${method} ${endpoint}`);

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'apikey': API_KEY,
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      timeout: 10000
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

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Add delay to avoid rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  try {
    // Test 1: Verify API connectivity
    console.log('Test 1: API Connectivity');
    console.log('─────────────────────────');
    const taxpayer = await makeRequest('GET', `/v2/dte/taxpayer/${COMPANY_RUT}`);
    if (taxpayer.status === 200) {
      console.log('✅ API Connected Successfully');
      console.log('Company:', taxpayer.data.razonSocial);
      console.log('RUT:', taxpayer.data.rut);
      console.log('Address:', taxpayer.data.direccion);
    } else {
      console.log('❌ Failed to connect:', taxpayer.status);
      return;
    }

    await delay(2000); // Wait 2 seconds to avoid rate limit

    // Test 2: Try to create a test Boleta (document type 39)
    console.log('\nTest 2: Create Test Boleta');
    console.log('─────────────────────────');

    const boletaPayload = {
      "response": ["PDF", "XML", "FOLIO"],
      "dte": {
        "Encabezado": {
          "IdDoc": {
            "TipoDTE": 39,  // Boleta Electrónica
            "FchEmis": new Date().toISOString().split('T')[0]
          },
          "Emisor": {
            "RUTEmisor": COMPANY_RUT
          },
          "Receptor": {
            "RUTRecep": "66666666-6",  // Generic consumer RUT
            "RznSocRecep": "CONSUMIDOR FINAL",
            "DirRecep": "SIN DIRECCION",
            "CmnaRecep": "SANTIAGO"
          },
          "Totales": {
            "MntNeto": 1000,
            "IVA": 190,
            "MntTotal": 1190
          }
        },
        "Detalle": [
          {
            "NroLinDet": 1,
            "NmbItem": "Servicio de Prueba",
            "QtyItem": 1,
            "PrcItem": 1000,
            "MontoItem": 1000
          }
        ]
      }
    };

    console.log('Sending test Boleta...');
    const boletaResult = await makeRequest('POST', '/v2/dte/document', boletaPayload);

    if (boletaResult.status === 200 || boletaResult.status === 201) {
      console.log('✅ Boleta created successfully!');
      console.log('Response:', JSON.stringify(boletaResult.data, null, 2));

      if (boletaResult.data.folio) {
        console.log(`\n📄 Document created with Folio: ${boletaResult.data.folio}`);
      }
    } else {
      console.log(`⚠️ Boleta creation returned status ${boletaResult.status}`);
      console.log('Response:', JSON.stringify(boletaResult.data, null, 2));
    }

    await delay(2000);

    // Test 3: List documents (if endpoint exists)
    console.log('\nTest 3: List Recent Documents');
    console.log('─────────────────────────');

    // Try the most common listing patterns
    const listEndpoints = [
      `/v2/dte?rutEmisor=${COMPANY_RUT}`,
      `/v2/dte/documento?rutEmisor=${COMPANY_RUT}`,
      `/v2/dte/documentos?rutEmisor=${COMPANY_RUT}`,
    ];

    for (const endpoint of listEndpoints) {
      try {
        const result = await makeRequest('GET', endpoint);
        if (result.status === 200) {
          console.log(`✅ Found working endpoint: ${endpoint}`);
          console.log('Response:', JSON.stringify(result.data, null, 2).substring(0, 500));
          break;
        } else if (result.status === 404) {
          console.log(`❌ ${endpoint} - Not found`);
        } else if (result.status === 429) {
          console.log(`⚠️ Rate limited - waiting...`);
          await delay(5000);
        } else {
          console.log(`⚠️ ${endpoint} - Status ${result.status}`);
        }
        await delay(1500);
      } catch (err) {
        console.log(`Error testing ${endpoint}:`, err.message);
      }
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ API Key is valid and working');
    console.log('✅ Can connect to OpenFactura');
    console.log('📝 Check if Boleta was created (see response above)');
    console.log('\nNOTE: The system appears to have no document listing endpoint');
    console.log('Documents may only be retrievable individually by ID/folio');
    console.log('Or through a different API structure than standard DTE endpoints');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run tests
runTests();