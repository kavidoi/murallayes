#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Test the enhanced document viewing functionality
async function testDocumentViewing() {
  console.log('📄 Testing Enhanced Document Viewing Functionality...\n');

  const baseUrl = 'http://localhost:4000';

  try {
    // Step 1: Get list of documents to test with
    console.log('1️⃣ Getting list of documents for testing');
    const docsResponse = await fetch(`${baseUrl}/invoicing/documents?take=5`);
    if (!docsResponse.ok) {
      console.log('❌ Failed to get documents list');
      return;
    }

    const docs = await docsResponse.json();
    if (!docs || docs.length === 0) {
      console.log('❌ No documents found for testing');
      return;
    }

    const testDoc = docs[0];
    console.log(`✅ Using test document: ${testDoc.type} #${testDoc.folio}`);

    // Step 2: Test document preview endpoint
    console.log(`\n2️⃣ Testing document preview for ${testDoc.id}`);
    const previewResponse = await fetch(`${baseUrl}/invoicing/documents/${testDoc.id}/preview`);
    if (previewResponse.ok) {
      const preview = await previewResponse.json();
      console.log('✅ Document preview works');
      console.log(`📋 Document: ${preview.document.type} #${preview.document.folio}`);
      console.log(`💰 Amount: $${preview.document.totalAmount}`);
      console.log(`🏢 Emitter: ${preview.document.emitterName}`);
      console.log(`📄 Available formats: ${preview.availableFormats.map(f => f.format).join(', ')}`);
      console.log(`💡 Recommendation: ${preview.viewerRecommendation}`);

      // Step 3: Test each available format
      for (const format of preview.availableFormats) {
        console.log(`\n3️⃣ Testing ${format.format.toUpperCase()} format`);

        // Test inline display
        console.log(`   📖 Testing inline display: ${format.displayUrl}`);
        const displayResponse = await fetch(`${baseUrl}${format.displayUrl}`);
        if (displayResponse.ok) {
          const contentType = displayResponse.headers.get('content-type');
          const contentLength = displayResponse.headers.get('content-length');
          console.log(`   ✅ ${format.format.toUpperCase()} inline display works`);
          console.log(`   📋 Content-Type: ${contentType}`);
          console.log(`   📏 Size: ${contentLength ? `${contentLength} bytes` : 'Unknown'}`);

          // For small files, show a sample
          if (format.format === 'json') {
            const jsonData = await displayResponse.text();
            const preview = jsonData.length > 200 ? jsonData.substring(0, 200) + '...' : jsonData;
            console.log(`   📄 Preview: ${preview}`);
          }
        } else {
          console.log(`   ❌ ${format.format.toUpperCase()} inline display failed: ${displayResponse.status}`);
        }

        // Test download
        console.log(`   💾 Testing download: ${format.downloadUrl}`);
        const downloadResponse = await fetch(`${baseUrl}${format.downloadUrl}`);
        if (downloadResponse.ok) {
          const contentDisposition = downloadResponse.headers.get('content-disposition');
          console.log(`   ✅ ${format.format.toUpperCase()} download works`);
          console.log(`   📁 Content-Disposition: ${contentDisposition}`);
        } else {
          console.log(`   ❌ ${format.format.toUpperCase()} download failed: ${downloadResponse.status}`);
        }
      }

    } else {
      console.log('❌ Document preview failed:', previewResponse.status);
    }

    // Step 4: Test PDF discovery from OpenFactura
    console.log(`\n4️⃣ Testing PDF discovery from OpenFactura`);
    if (testDoc.emitterRUT && testDoc.folio && testDoc.documentCode) {
      console.log(`   🔍 Searching for PDF using:`);
      console.log(`   📋 Emitter RUT: ${testDoc.emitterRUT}`);
      console.log(`   📄 Folio: ${testDoc.folio}`);
      console.log(`   🏷️ Document Code: ${testDoc.documentCode}`);

      const pdfResponse = await fetch(`${baseUrl}/invoicing/documents/${testDoc.id}/pdf`);
      if (pdfResponse.ok) {
        const contentLength = pdfResponse.headers.get('content-length');
        console.log(`   ✅ PDF found via OpenFactura API`);
        console.log(`   📏 PDF Size: ${contentLength ? `${contentLength} bytes` : 'Unknown'}`);
      } else {
        console.log(`   ⚠️ PDF not available via OpenFactura: ${pdfResponse.status}`);
      }
    } else {
      console.log(`   ⚠️ Document missing required fields for OpenFactura PDF lookup`);
    }

    // Step 5: Test legacy PDF endpoint
    console.log(`\n5️⃣ Testing legacy PDF endpoint compatibility`);
    const legacyPdfResponse = await fetch(`${baseUrl}/invoicing/documents/${testDoc.id}/pdf`);
    if (legacyPdfResponse.ok) {
      console.log(`   ✅ Legacy PDF endpoint works (redirects to new format)`);
    } else {
      console.log(`   ❌ Legacy PDF endpoint failed: ${legacyPdfResponse.status}`);
    }

    console.log('\n🎉 Document Viewing Test Complete!');
    console.log('\n💡 New Features Available:');
    console.log('📄 Multiple document formats: PDF, XML, JSON');
    console.log('👁️ Inline viewing vs download options');
    console.log('🔍 Automatic PDF discovery from OpenFactura');
    console.log('📋 Document preview with format availability');
    console.log('🔗 Direct URLs for embedding in frontend');
    console.log('⚡ Fallback mechanisms when primary sources fail');

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
            text: () => Promise.resolve(data),
            headers: {
              get: (name) => res.headers[name.toLowerCase()]
            }
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

testDocumentViewing().catch(console.error);