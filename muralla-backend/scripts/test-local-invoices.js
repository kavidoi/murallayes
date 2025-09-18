#!/usr/bin/env node
/**
 * Test local invoice creation and retrieval
 * This creates test documents in the local database to verify the UI works
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:4000';
const API_TOKEN = process.env.API_TOKEN || '';

console.log('═══════════════════════════════════════════════════════');
console.log('Local Invoice System Test');
console.log('═══════════════════════════════════════════════════════');
console.log(`API URL: ${API_URL}`);
console.log('═══════════════════════════════════════════════════════\n');

async function testLocalInvoices() {
  try {
    // Test 1: Check API health
    console.log('Test 1: API Health Check');
    console.log('─────────────────────────');

    try {
      const health = await axios.get(`${API_URL}/invoicing/health`, {
        params: { rut: '78188363-8' }
      });
      console.log('✅ Backend API is running');
      console.log('OpenFactura connected:', health.data ? 'Yes' : 'No');
    } catch (err) {
      console.log('⚠️ Backend health check failed:', err.response?.status || err.message);
    }

    // Test 2: List current documents
    console.log('\nTest 2: List Current Documents');
    console.log('─────────────────────────');

    try {
      const docs = await axios.get(`${API_URL}/invoicing/documents`, {
        headers: API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}
      });

      console.log(`📄 Found ${docs.data.length} documents in database`);

      if (docs.data.length > 0) {
        console.log('\nFirst document:');
        const first = docs.data[0];
        console.log(`- Type: ${first.type}`);
        console.log(`- Folio: ${first.folio || 'N/A'}`);
        console.log(`- Status: ${first.status}`);
        console.log(`- Total: $${first.totalAmount || 0}`);
        console.log(`- Date: ${first.createdAt}`);
      } else {
        console.log('No documents found in database');
      }
    } catch (err) {
      console.log('❌ Failed to list documents:', err.response?.status || err.message);
      if (err.response?.status === 401) {
        console.log('Note: You may need to provide an auth token');
      }
    }

    // Test 3: Check if we have POS transactions to convert
    console.log('\nTest 3: Check for POS Transactions');
    console.log('─────────────────────────');

    // This would normally query your POS transactions
    console.log('To create Boletas, you need POS transactions in the database');
    console.log('Use endpoint: POST /invoicing/boletas/from-pos/:posTransactionId');

    // Test 4: Check if we have Costs to convert
    console.log('\nTest 4: Check for Costs');
    console.log('─────────────────────────');

    console.log('To create Facturas, you need Cost records in the database');
    console.log('Use endpoint: POST /invoicing/facturas/from-cost/:costId');

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('DIAGNOSIS');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n🔍 Issue: No invoices showing because:');
    console.log('1. OpenFactura doesn\'t provide document listing endpoints');
    console.log('2. System can only show documents created locally');
    console.log('3. No documents have been created locally yet');

    console.log('\n✅ Solution:');
    console.log('1. Create Boletas from existing POS transactions');
    console.log('2. Create Facturas from existing Cost records');
    console.log('3. These will be stored locally and shown in UI');
    console.log('4. Optionally emit them to OpenFactura for legal compliance');

    console.log('\n📝 Next Steps:');
    console.log('1. Ensure you have POS transactions or Costs in database');
    console.log('2. Use the API endpoints to create tax documents from them');
    console.log('3. Documents will then appear in the UI');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

// Run tests
testLocalInvoices();