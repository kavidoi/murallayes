#!/usr/bin/env node

/**
 * OpenFactura API Endpoint Discovery Script
 * This script tests various possible endpoints to find documents for RUT 78188363-8
 */

const axios = require('axios');

const COMPANY_RUT = '78188363-8';
const API_BASE = 'https://api.haulmer.com';
const API_KEY = process.env.OPENFACTURA_API_KEY || '';

if (!API_KEY) {
  console.error('❌ OPENFACTURA_API_KEY environment variable not set');
  process.exit(1);
}

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'apikey': API_KEY,
    'accept': 'application/json',
    'content-type': 'application/json',
  },
  timeout: 15000,
});

// List of potential endpoints to test
const ENDPOINTS_TO_TEST = [
  // Direct document endpoints
  `/v2/dte/document?rut=${COMPANY_RUT}`,
  `/v2/dte/documents?rut=${COMPANY_RUT}`,
  `/v2/dte/document?rutEmisor=${COMPANY_RUT}`,
  `/v2/dte/document?rutReceptor=${COMPANY_RUT}`,

  // Taxpayer-specific endpoints
  `/v2/dte/taxpayer/${COMPANY_RUT}/documents`,
  `/v2/dte/taxpayer/${COMPANY_RUT}/document`,
  `/v2/dte/taxpayer/${COMPANY_RUT}/dte`,

  // List endpoints
  `/v2/dte/list?rut=${COMPANY_RUT}`,
  `/v2/dte/list?rutEmisor=${COMPANY_RUT}`,
  `/v2/dte/list?rutReceptor=${COMPANY_RUT}`,

  // Search endpoints
  `/v2/dte/search?rut=${COMPANY_RUT}`,
  `/v2/dte/search?rutEmisor=${COMPANY_RUT}`,
  `/v2/dte/search?rutReceptor=${COMPANY_RUT}`,

  // Generic endpoints
  `/v2/dte`,
  `/v2/dte/document`,
  `/v2/documents`,
  `/v2/document`,

  // With date filters (last 30 days)
  `/v2/dte/document?rut=${COMPANY_RUT}&fechaDesde=${getDateString(-30)}`,
  `/v2/dte/documents?rut=${COMPANY_RUT}&fechaDesde=${getDateString(-30)}`,

  // Issued vs Received
  `/v2/dte/emitidos?rut=${COMPANY_RUT}`,
  `/v2/dte/recibidos?rut=${COMPANY_RUT}`,
  `/v2/dte/issued?rut=${COMPANY_RUT}`,
  `/v2/dte/received?rut=${COMPANY_RUT}`,

  // Alternative paths
  `/v1/dte/document?rut=${COMPANY_RUT}`,
  `/api/v2/dte/document?rut=${COMPANY_RUT}`,
  `/api/dte/document?rut=${COMPANY_RUT}`,
];

function getDateString(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() + daysAgo);
  return date.toISOString().split('T')[0];
}

async function testEndpoint(endpoint) {
  try {
    console.log(`🔍 Testing: ${endpoint}`);
    const response = await api.get(endpoint);

    const data = response.data;
    const status = response.status;

    if (status === 200) {
      if (Array.isArray(data)) {
        console.log(`✅ SUCCESS: Found array with ${data.length} items`);
        if (data.length > 0) {
          console.log(`📄 Sample document:`, JSON.stringify(data[0], null, 2));
          return { endpoint, success: true, count: data.length, data: data.slice(0, 3) };
        }
      } else if (data && typeof data === 'object') {
        if (data.documents && Array.isArray(data.documents)) {
          console.log(`✅ SUCCESS: Found documents array with ${data.documents.length} items`);
          if (data.documents.length > 0) {
            console.log(`📄 Sample document:`, JSON.stringify(data.documents[0], null, 2));
            return { endpoint, success: true, count: data.documents.length, data: data.documents.slice(0, 3) };
          }
        } else if (data.data && Array.isArray(data.data)) {
          console.log(`✅ SUCCESS: Found data array with ${data.data.length} items`);
          if (data.data.length > 0) {
            console.log(`📄 Sample document:`, JSON.stringify(data.data[0], null, 2));
            return { endpoint, success: true, count: data.data.length, data: data.data.slice(0, 3) };
          }
        } else {
          console.log(`✅ SUCCESS: Got object response`);
          console.log(`📋 Response keys:`, Object.keys(data));
          if (Object.keys(data).length > 0) {
            console.log(`📄 Sample data:`, JSON.stringify(data, null, 2));
            return { endpoint, success: true, count: 1, data: [data] };
          }
        }
      }
      console.log(`⚠️  Empty response from ${endpoint}`);
      return { endpoint, success: false, error: 'Empty response' };
    }

  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    if (status === 404) {
      console.log(`❌ 404: Endpoint not found`);
    } else if (status === 401) {
      console.log(`❌ 401: Unauthorized (API key issue?)`);
    } else if (status === 403) {
      console.log(`❌ 403: Forbidden`);
    } else if (status === 400) {
      console.log(`❌ 400: Bad request - ${message}`);
    } else {
      console.log(`❌ Error: ${status} - ${message}`);
    }

    return { endpoint, success: false, error: `${status}: ${message}` };
  }

  console.log('');
  return { endpoint, success: false, error: 'Unknown' };
}

async function main() {
  console.log(`🚀 OpenFactura API Endpoint Discovery`);
  console.log(`📋 Company RUT: ${COMPANY_RUT}`);
  console.log(`🌐 API Base: ${API_BASE}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...`);
  console.log(`📅 Testing ${ENDPOINTS_TO_TEST.length} endpoints\n`);

  const results = [];

  for (const endpoint of ENDPOINTS_TO_TEST) {
    const result = await testEndpoint(endpoint);
    results.push(result);

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY REPORT');
  console.log('='.repeat(80));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful endpoints: ${successful.length}`);
  console.log(`❌ Failed endpoints: ${failed.length}`);

  if (successful.length > 0) {
    console.log('\n🎉 WORKING ENDPOINTS:');
    successful.forEach(result => {
      console.log(`  📍 ${result.endpoint} (${result.count} documents)`);
    });

    console.log('\n📋 RECOMMENDED ENDPOINT FOR IMPLEMENTATION:');
    const best = successful.sort((a, b) => b.count - a.count)[0];
    console.log(`  🥇 ${best.endpoint}`);
    console.log(`  📊 Returns ${best.count} documents`);

    if (best.data && best.data.length > 0) {
      console.log('\n📄 SAMPLE DOCUMENT STRUCTURE:');
      console.log(JSON.stringify(best.data[0], null, 2));
    }
  } else {
    console.log('\n❌ NO WORKING ENDPOINTS FOUND');
    console.log('\nPossible causes:');
    console.log('  • API key may not have document access permissions');
    console.log('  • Documents may be in a different API version');
    console.log('  • Company RUT may not have any documents in OpenFactura');
    console.log('  • API endpoints may use different naming conventions');
  }

  console.log('\n🔧 Next steps:');
  if (successful.length > 0) {
    console.log('  1. Update InvoicingService to use the working endpoint');
    console.log('  2. Implement proper data mapping based on response structure');
    console.log('  3. Test document fetching in the invoicing page');
  } else {
    console.log('  1. Verify API key permissions with OpenFactura support');
    console.log('  2. Check if documents exist in the web interface');
    console.log('  3. Try alternative API authentication methods');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testEndpoint, ENDPOINTS_TO_TEST };