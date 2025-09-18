#!/usr/bin/env node

const https = require('https');

// Test the enhanced received documents endpoints
async function testEnhancedEndpoints() {
  console.log('🔍 Testing Enhanced OpenFactura Received Documents API...\n');

  const baseUrl = 'http://localhost:4000';

  try {
    // Test 1: Basic fetch with pagination
    console.log('1️⃣ Testing basic fetch with pagination');
    const basicResponse = await fetch(`${baseUrl}/invoicing/received-documents?page=1`);
    if (basicResponse.ok) {
      const data = await basicResponse.json();
      console.log('✅ Basic fetch works');
      console.log(`📄 Found ${data.total || 0} total documents`);
      if (data.documents && data.documents.length > 0) {
        const doc = data.documents[0];
        console.log(`📋 Sample: ${doc.nombreEmisor} - ${doc.tipoDocumentoNombre} #${doc.folio} ($${doc.montoTotal})`);
        console.log(`💳 Payment: ${doc.formaPagoDescripcion}`);
        console.log(`🛒 Purchase: ${doc.tipoTransaccionCompraDescripcion}`);
        console.log(`📅 Days from emission to reception: ${doc.diasEmisionRecepcion || 'N/A'}`);
        if (doc.tieneAcuses) {
          console.log(`✅ Has ${doc.acuses.length} acknowledgments`);
        }
      }
    } else {
      console.log('❌ Basic fetch failed:', basicResponse.status);
    }

    // Test 2: Filter by document type (Facturas only)
    console.log('\n2️⃣ Testing filter by document type (Facturas only)');
    const facturaResponse = await fetch(`${baseUrl}/invoicing/received-documents?tipoDocumento=33&page=1`);
    if (facturaResponse.ok) {
      const data = await facturaResponse.json();
      console.log('✅ Factura filter works');
      console.log(`📊 Found ${data.documents?.length || 0} facturas in this page`);
    } else {
      console.log('❌ Factura filter failed:', facturaResponse.status);
    }

    // Test 3: Filter by supplier RUT
    console.log('\n3️⃣ Testing filter by supplier RUT (SODIMAC)');
    const sodimacResponse = await fetch(`${baseUrl}/invoicing/received-documents?rutEmisor=94965100&page=1`);
    if (sodimacResponse.ok) {
      const data = await sodimacResponse.json();
      console.log('✅ RUT filter works');
      console.log(`🏪 Found ${data.documents?.length || 0} documents from this supplier`);
      if (data.documents && data.documents.length > 0) {
        console.log(`🏢 Supplier: ${data.documents[0].nombreEmisor}`);
      }
    } else {
      console.log('❌ RUT filter failed:', sodimacResponse.status);
    }

    // Test 4: Date range filter
    console.log('\n4️⃣ Testing date range filter (last 30 days)');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const dateResponse = await fetch(`${baseUrl}/invoicing/received-documents?startDate=${startDate}&dateField=FchRecepOF&page=1`);
    if (dateResponse.ok) {
      const data = await dateResponse.json();
      console.log('✅ Date filter works');
      console.log(`📅 Found ${data.documents?.length || 0} documents in last 30 days`);
    } else {
      console.log('❌ Date filter failed:', dateResponse.status);
    }

    // Test 5: Enhanced import with detailed info
    console.log('\n5️⃣ Testing enhanced import (dry run)');
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
      console.log('✅ Enhanced import works');
      console.log(`🔄 Would import ${data.totalImported} documents`);
      console.log(`⏭️ Would skip ${data.totalSkipped} duplicates`);
      console.log(`❌ Errors: ${data.errors.length}`);
      if (data.imported && data.imported.length > 0) {
        console.log('📦 Sample imports:');
        data.imported.slice(0, 3).forEach(doc => {
          console.log(`  - ${doc.supplier}: ${doc.type} #${doc.folio} ($${doc.amount})`);
        });
      }
    } else {
      console.log('❌ Enhanced import failed:', importResponse.status);
    }

    console.log('\n✨ Enhanced API features:');
    console.log('🔍 Advanced filtering by document type, supplier RUT, and date ranges');
    console.log('📋 Rich document information with human-readable descriptions');
    console.log('⏰ Automatic date calculations (days between emission and reception)');
    console.log('✅ Acknowledgment status tracking');
    console.log('🏪 Enhanced supplier and payment method information');
    console.log('📊 Better duplicate detection and error handling');

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

testEnhancedEndpoints().catch(console.error);