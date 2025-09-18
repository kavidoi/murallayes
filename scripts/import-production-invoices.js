#!/usr/bin/env node

/**
 * Import received invoices from OpenFactura to production database
 * This script connects directly to the production API
 */

const https = require('https');

// Configuration
const API_BASE = 'muralla-backend.onrender.com';
const EMAIL = 'admin@murallacafe.cl';
const PASSWORD = '123';

// Helper function to make HTTPS requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || body}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          } else {
            resolve(body);
          }
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function getAuthToken() {
  console.log('🔐 Getting authentication token...');
  
  const loginData = { email: EMAIL, password: PASSWORD };
  
  const options = {
    hostname: API_BASE,
    port: 443,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': JSON.stringify(loginData).length
    }
  };

  try {
    const response = await makeRequest(options, loginData);
    if (!response.access_token) {
      throw new Error('No access token received');
    }
    console.log('✅ Authentication successful');
    return response.access_token;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

async function importReceivedDocuments(token) {
  console.log('\n📥 Starting import of received documents...');
  
  // Get date range for last 60 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 60);
  
  const importData = {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    dryRun: false
  };
  
  console.log(`📅 Date range: ${importData.startDate} to ${importData.endDate}`);
  
  const options = {
    hostname: API_BASE,
    port: 443,
    path: '/invoicing/received-documents/import',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': JSON.stringify(importData).length
    }
  };

  try {
    const response = await makeRequest(options, importData);
    return response;
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    throw error;
  }
}

async function getDocumentCount(token) {
  const options = {
    hostname: API_BASE,
    port: 443,
    path: '/invoicing/documents',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  try {
    const documents = await makeRequest(options);
    return Array.isArray(documents) ? documents.length : 0;
  } catch (error) {
    console.error('❌ Failed to get document count:', error.message);
    return 0;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Import OpenFactura Received Documents to Production');
  console.log('═══════════════════════════════════════════════════════');
  
  try {
    // Get auth token
    const token = await getAuthToken();
    
    // Check current document count
    const beforeCount = await getDocumentCount(token);
    console.log(`\n📊 Current documents in database: ${beforeCount}`);
    
    // Import received documents
    const result = await importReceivedDocuments(token);
    
    console.log('\n✅ Import completed successfully!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📥 Total fetched: ${result.totalFetched}`);
    console.log(`✅ Total imported: ${result.totalImported}`);
    console.log(`⏭️  Total skipped (already exist): ${result.totalSkipped}`);
    console.log(`❌ Errors: ${result.errors.length}`);
    
    if (result.imported && result.imported.length > 0) {
      console.log('\n📋 Sample of imported documents:');
      result.imported.slice(0, 5).forEach(doc => {
        console.log(`  - ${doc.supplier}: ${doc.type} #${doc.folio} - $${doc.amount.toLocaleString('es-CL')}`);
      });
    }
    
    // Check new document count
    const afterCount = await getDocumentCount(token);
    console.log(`\n📊 Total documents now in database: ${afterCount}`);
    console.log(`📈 New documents added: ${afterCount - beforeCount}`);
    
    console.log('\n🎉 Success! Visit https://admin.murallacafe.cl/finance/invoicing to see the documents.');
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
