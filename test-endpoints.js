#!/usr/bin/env node

const https = require('https');

// Test the local endpoints to see if they work
async function testEndpoints() {
  console.log('Testing new received documents endpoints...');

  const baseUrl = 'http://localhost:4000';

  try {
    // Test 1: Fetch received documents
    console.log('\n1. Testing GET /invoicing/received-documents');
    const fetchResponse = await fetch(`${baseUrl}/invoicing/received-documents?page=1`);
    if (fetchResponse.ok) {
      const data = await fetchResponse.json();
      console.log('✅ Received documents endpoint works');
      console.log(`Found ${data.total || 0} total documents, showing page ${data.currentPage || 1}`);
      if (data.documents && data.documents.length > 0) {
        console.log(`First document: ${data.documents[0].nombreEmisor} - ${data.documents[0].tipoDocumento} #${data.documents[0].folio}`);
      }
    } else {
      console.log('❌ Received documents endpoint failed:', fetchResponse.status);
    }

    // Test 2: Import (dry run)
    console.log('\n2. Testing POST /invoicing/received-documents/import (dry run)');
    const importResponse = await fetch(`${baseUrl}/invoicing/received-documents/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dryRun: true,
        startDate: '2024-08-01',
        endDate: '2024-12-31'
      })
    });

    if (importResponse.ok) {
      const data = await importResponse.json();
      console.log('✅ Import endpoint works');
      console.log(`Would import ${data.totalImported} documents, skip ${data.totalSkipped}, errors: ${data.errors.length}`);
    } else {
      console.log('❌ Import endpoint failed:', importResponse.status);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('Make sure the backend is running on localhost:4000');
  }
}

// Node 18+ has fetch built-in, for older versions use this polyfill
if (typeof fetch === 'undefined') {
  global.fetch = function(url, options = {}) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https:');
      const client = isHttps ? https : require('http');

      const parsedUrl = new URL(url);
      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      };

      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data)),
          });
        });
      });

      req.on('error', reject);

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  };
}

testEndpoints().catch(console.error);