#!/usr/bin/env node
/*
  Simple connectivity test for OpenFactura (Haulmer) API using an API key from env.
  Does NOT print the key. Exits with non‑zero on failure.
*/
const https = require('https');
const fs = require('fs');
const path = require('path');

function getEnv(name, fallback) {
  if (process.env[name] && process.env[name].trim()) return process.env[name].trim();
  return fallback;
}

let BASE = getEnv('OPENFACTURA_BASE_URL', 'https://api.haulmer.com');
let KEY = getEnv('OPENFACTURA_API_KEY');
const TEST_RUT = getEnv('OPENFACTURA_TEST_RUT', '76795561-8'); // Haulmer RUT used in docs

// Fallback: read from muralla-backend/.env (no dotenv dependency)
if (!KEY) {
  try {
    const envPath = path.resolve(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
      for (const line of lines) {
        const m1 = line.match(/^OPENFACTURA_API_KEY\s*=\s*(.+)$/);
        if (m1) KEY = m1[1].trim().replace(/^['\"]|['\"]$/g, '');
        const m2 = line.match(/^OPENFACTURA_BASE_URL\s*=\s*(.+)$/);
        if (m2) BASE = m2[1].trim().replace(/^['\"]|['\"]$/g, '');
      }
    }
  } catch {}
}

if (!KEY) {
  console.error('OPENFACTURA_API_KEY is not set (env or muralla-backend/.env).');
  process.exit(2);
}

const url = `${BASE.replace(/\/$/, '')}/v2/dte/taxpayer/${encodeURIComponent(TEST_RUT)}`;

const req = https.request(url, {
  method: 'GET',
  headers: {
    'apikey': KEY,
    'accept': 'application/json'
  },
  timeout: 8000,
}, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    const status = res.statusCode || 0;
    // Do not print full body on success; just a small snippet
    let snippet = '';
    try {
      const json = JSON.parse(data);
      snippet = JSON.stringify(json).slice(0, 200);
    } catch {
      snippet = String(data || '').slice(0, 200);
    }
    if (status >= 200 && status < 300) {
      console.log('OpenFactura API key OK. Status:', status);
      console.log('Endpoint:', url);
      console.log('Response snippet:', snippet);
      process.exit(0);
    } else {
      console.error('OpenFactura API key test failed. Status:', status);
      console.error('Endpoint:', url);
      console.error('Response snippet:', snippet);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
  process.exit(3);
});

req.on('timeout', () => {
  console.error('Request timeout');
  req.destroy();
  process.exit(4);
});

req.end();
