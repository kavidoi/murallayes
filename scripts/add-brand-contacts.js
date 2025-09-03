const axios = require('axios');

const brandContacts = [
  { sku: 'BNK', name: 'BRISNACKS' },
  { sku: 'SMT', name: 'SMUTTER' },
  { sku: 'DKK', name: 'DR COMBU KOMBUCHA' },
  { sku: 'SHF', name: 'SUPER HUMAN FOODS' },
  { sku: 'AESC', name: 'AGUA ESCENCIAL' },
  { sku: 'AMZC', name: 'AMAZING CARE' },
  { sku: 'BNDT', name: 'BENEDICTINO' },
  { sku: 'BNTR', name: 'BINATUR' },
  { sku: 'CMFR', name: 'COMIDA EN FRASCO' },
  { sku: 'MAV', name: 'MIS AMIGOS VEGANOS' },
  { sku: 'SSNK', name: 'SOLE SNICKERS' },
  { sku: 'AMCH', name: 'AM CHOCOLATES' }
];

const API_BASE_URL = 'http://localhost:3000';

async function addBrandContacts() {
  console.log('Adding brand contacts...');
  
  for (const brand of brandContacts) {
    try {
      const contactData = {
        name: brand.name,
        type: 'brand',
        skuAbbreviation: brand.sku,
        email: `${brand.sku.toLowerCase()}@example.com`,
        phone: '',
        address: '',
        tags: ['brand', 'supplier'],
        notes: `Brand contact for ${brand.name}`
      };

      const response = await axios.post(`${API_BASE_URL}/contacts`, contactData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Added ${brand.name} (${brand.sku})`);
    } catch (error) {
      console.error(`❌ Failed to add ${brand.name} (${brand.sku}):`, error.response?.data || error.message);
    }
  }
  
  console.log('Finished adding brand contacts!');
}

addBrandContacts().catch(console.error);
