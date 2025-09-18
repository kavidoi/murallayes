#!/usr/bin/env node
/**
 * OpenFactura API Document Testing Script
 * Tests various endpoints to find and retrieve documents
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const COMPANY_RUT = process.env.COMPANY_RUT || '78188363-8';
const BASE_URL = process.env.OPENFACTURA_BASE_URL || 'https://api.haulmer.com';
let API_KEY = process.env.OPENFACTURA_API_KEY || '';

// Try to read API key from .env if not in environment
if (!API_KEY) {
  try {
    const envPath = path.resolve(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
      for (const line of lines) {
        const match = line.match(/^OPENFACTURA_API_KEY\s*=\s*(.+)$/);
        if (match) {
          API_KEY = match[1].trim().replace(/^['\"]|['\"]$/g, '');
        }
      }
    }
  } catch (err) {
    console.error('Error reading .env file:', err.message);
  }
}

if (!API_KEY) {
  console.error('\n❌ OPENFACTURA_API_KEY not found in environment variables or .env file');
  console.error('Please set OPENFACTURA_API_KEY environment variable or add it to .env file');
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════════');
console.log('OpenFactura API Document Testing');
console.log('═══════════════════════════════════════════════════════');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Company RUT: ${COMPANY_RUT}`);
console.log(`API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}`);
console.log('═══════════════════════════════════════════════════════\n');

// Helper function to make API requests
function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL.replace(/\/$/, '')}${endpoint}`;
    console.log(`\n📡 Testing: ${endpoint}`);

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
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
        const status = res.statusCode || 0;
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status, data: json, success: status >= 200 && status < 300 });
        } catch (e) {
          resolve({ status, data, success: false, error: 'Invalid JSON response' });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, error: err.message, success: false });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, error: 'Request timeout', success: false });
    });

    req.end();
  });
}

// Helper to format dates
function getDateString(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

// Main test function
async function runTests() {
  const results = [];

  // Test 1: Basic connectivity
  console.log('\n🧪 TEST 1: Basic Connectivity Check');
  console.log('────────────────────────────────────');
  const healthCheck = await makeRequest(`/v2/dte/taxpayer/${encodeURIComponent(COMPANY_RUT)}`);
  if (healthCheck.success) {
    console.log('✅ API Key is valid and working');
    console.log('Taxpayer info:', JSON.stringify(healthCheck.data, null, 2).substring(0, 500));
  } else {
    console.log(`❌ API connection failed: ${healthCheck.status} - ${healthCheck.error || JSON.stringify(healthCheck.data)}`);
  }
  results.push({ test: 'Health Check', ...healthCheck });

  // Test 2: Document endpoints with different parameters
  console.log('\n🧪 TEST 2: Document Retrieval Endpoints');
  console.log('────────────────────────────────────');

  const documentEndpoints = [
    // Most common patterns
    `/v2/dte/document?rutEmisor=${COMPANY_RUT}`,
    `/v2/dte/documents?rutEmisor=${COMPANY_RUT}`,
    `/v2/dte/document?rutReceptor=${COMPANY_RUT}`,
    `/v2/dte/documents?rutReceptor=${COMPANY_RUT}`,

    // With date ranges (last 30 days)
    `/v2/dte/document?rutEmisor=${COMPANY_RUT}&fechaDesde=${getDateString(30)}&fechaHasta=${getDateString(0)}`,
    `/v2/dte/documents?rutEmisor=${COMPANY_RUT}&fechaDesde=${getDateString(30)}&fechaHasta=${getDateString(0)}`,

    // Specific document types
    `/v2/dte/document?rutEmisor=${COMPANY_RUT}&codigoTipoDocumento=39`, // Boletas
    `/v2/dte/document?rutEmisor=${COMPANY_RUT}&codigoTipoDocumento=33`, // Facturas

    // Emitted vs Received
    `/v2/dte/emitidos?rutEmisor=${COMPANY_RUT}`,
    `/v2/dte/recibidos?rutReceptor=${COMPANY_RUT}`,

    // Taxpayer-specific endpoints
    `/v2/dte/taxpayer/${COMPANY_RUT}/documents`,
    `/v2/dte/taxpayer/${COMPANY_RUT}/emitidos`,
    `/v2/dte/taxpayer/${COMPANY_RUT}/recibidos`,

    // List endpoints
    `/v2/dte/list?rutEmisor=${COMPANY_RUT}`,
    `/v2/dte/list?rutReceptor=${COMPANY_RUT}`,

    // Search endpoints
    `/v2/dte/search?rutEmisor=${COMPANY_RUT}`,
    `/v2/dte/search?rutReceptor=${COMPANY_RUT}`,
  ];

  for (const endpoint of documentEndpoints) {
    const result = await makeRequest(endpoint);

    if (result.success) {
      let documentCount = 0;
      let documents = [];

      // Parse different response formats
      if (Array.isArray(result.data)) {
        documents = result.data;
        documentCount = documents.length;
      } else if (result.data.documents && Array.isArray(result.data.documents)) {
        documents = result.data.documents;
        documentCount = documents.length;
      } else if (result.data.data && Array.isArray(result.data.data)) {
        documents = result.data.data;
        documentCount = documents.length;
      } else if (result.data.dte && Array.isArray(result.data.dte)) {
        documents = result.data.dte;
        documentCount = documents.length;
      } else if (result.data.items && Array.isArray(result.data.items)) {
        documents = result.data.items;
        documentCount = documents.length;
      }

      if (documentCount > 0) {
        console.log(`✅ SUCCESS: Found ${documentCount} documents`);
        console.log('First document:', JSON.stringify(documents[0], null, 2));

        // Analyze document structure
        const firstDoc = documents[0];
        console.log('\n📋 Document Structure:');
        console.log('Keys:', Object.keys(firstDoc).join(', '));

        results.push({
          test: endpoint,
          success: true,
          documentCount,
          sampleDocument: firstDoc,
          allKeys: Object.keys(firstDoc)
        });
      } else {
        console.log(`⚠️ Empty response (status ${result.status})`);
        console.log('Response structure:', Object.keys(result.data).join(', '));
        results.push({ test: endpoint, success: true, documentCount: 0, responseKeys: Object.keys(result.data) });
      }
    } else {
      console.log(`❌ Failed: ${result.status} - ${result.error || 'No error message'}`);
      if (result.data) {
        console.log('Error response:', JSON.stringify(result.data).substring(0, 200));
      }
      results.push({ test: endpoint, success: false, status: result.status, error: result.error });
    }
  }

  // Test 3: Try alternative API versions
  console.log('\n🧪 TEST 3: Alternative API Paths');
  console.log('────────────────────────────────────');

  const alternativePaths = [
    `/v1/dte/document?rutEmisor=${COMPANY_RUT}`,
    `/api/v2/dte/document?rutEmisor=${COMPANY_RUT}`,
    `/api/dte/document?rutEmisor=${COMPANY_RUT}`,
    `/dte/document?rutEmisor=${COMPANY_RUT}`,
  ];

  for (const endpoint of alternativePaths) {
    const result = await makeRequest(endpoint);
    if (result.success) {
      console.log(`✅ Alternative path works: ${endpoint}`);
      results.push({ test: endpoint, ...result });
    } else {
      console.log(`❌ ${endpoint}: ${result.status}`);
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════');

  const successful = results.filter(r => r.success);
  const withDocuments = results.filter(r => r.documentCount > 0);

  console.log(`Total endpoints tested: ${results.length}`);
  console.log(`Successful responses: ${successful.length}`);
  console.log(`Endpoints with documents: ${withDocuments.length}`);

  if (withDocuments.length > 0) {
    console.log('\n✅ WORKING ENDPOINTS WITH DOCUMENTS:');
    withDocuments.forEach(r => {
      console.log(`  - ${r.test}: ${r.documentCount} documents`);
    });

    console.log('\n📄 SAMPLE DOCUMENT STRUCTURE:');
    const sample = withDocuments[0].sampleDocument;
    if (sample) {
      console.log(JSON.stringify(sample, null, 2));
    }
  } else {
    console.log('\n⚠️ No documents found in any endpoint');
    console.log('Possible reasons:');
    console.log('  1. No documents exist for this RUT in the date range');
    console.log('  2. API permissions might be limited');
    console.log('  3. Documents might be in a different status or type');
    console.log('  4. The RUT might need to be registered as an emisor/receptor');
  }

  // Save results to file
  const outputPath = path.join(__dirname, 'openfactura-test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    config: { BASE_URL, COMPANY_RUT },
    results: results
  }, null, 2));
  console.log(`\n📁 Full results saved to: ${outputPath}`);
}

// Run the tests
runTests().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});