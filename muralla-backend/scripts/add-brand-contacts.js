const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const brandContacts = [
  {
    name: "BRISNACKS",
    type: "brand",
    entityType: "business",
    skuAbbreviation: "BNK",
    company: "BRISNACKS"
  },
  {
    name: "SMUTTER", 
    type: "brand",
    entityType: "business",
    skuAbbreviation: "SMT",
    company: "SMUTTER"
  },
  {
    name: "DR COMBU KOMBUCHA",
    type: "brand",
    entityType: "business",
    skuAbbreviation: "DKK",
    company: "DR COMBU KOMBUCHA"
  },
  {
    name: "SUPER HUMAN FOODS",
    type: "brand",
    entityType: "business",
    skuAbbreviation: "SHF",
    company: "SUPER HUMAN FOODS"
  },
  {
    name: "AGUA ESCENCIAL",
    type: "brand",
    entityType: "business",
    skuAbbreviation: "AESC",
    company: "AGUA ESCENCIAL"
  },
  {
    name: "AMAZING CARE",
    type: "brand",
    entityType: "business",
    skuAbbreviation: "AMZC",
    company: "AMAZING CARE"
  },
  {
    name: "BENEDICTINO",
    type: "brand",
    entityType: "business",
    skuAbbreviation: "BNDT",
    company: "BENEDICTINO"
  },
  {
    name: "BINATUR",
    type: "brand",
    entityType: "business",
    skuAbbreviation: "BNTR",
    company: "BINATUR"
  },
  {
    name: "COMIDA EN FRASCO",
    type: "brand",
    entityType: "business",
    skuAbbreviation: "CMFR",
    company: "COMIDA EN FRASCO"
  },
  {
    name: "MIS AMIGOS VEGANOS",
    type: "brand",
    entityType: "business",
    skuAbbreviation: "MAV",
    company: "MIS AMIGOS VEGANOS"
  },
  {
    name: "SOLE SNICKERS",
    type: "brand",
    entityType: "business",
    skuAbbreviation: "SSNK",
    company: "SOLE SNICKERS"
  },
  {
    name: "HANS ANDRESEN CHOCOLATES",
    type: "brand",
    entityType: "business",
    skuAbbreviation: "HACH",
    company: "HANS ANDRESEN CHOCOLATES"
  }
];

async function addBrandContacts() {
  try {
    console.log('🏷️ Adding brand contacts...');
    
    for (const contact of brandContacts) {
      try {
        // Check if contact already exists
        const existingContact = await prisma.contact.findFirst({
          where: {
            name: contact.name,
            isDeleted: false
          }
        });
        
        if (existingContact) {
          console.log(`⚠️  Contact "${contact.name}" already exists, skipping...`);
          continue;
        }
        
        // Create the contact
        const createdContact = await prisma.contact.create({
          data: {
            ...contact,
            tags: [],
            relationshipScore: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false
          }
        });
        
        console.log(`✅ Added: ${contact.name} (${contact.skuAbbreviation})`);
      } catch (error) {
        console.error(`❌ Failed to add ${contact.name}:`, error.message);
      }
    }
    
    console.log('\n🎉 Finished adding brand contacts!');
    
    // Show summary
    const totalBrands = await prisma.contact.count({
      where: {
        type: 'brand',
        isDeleted: false
      }
    });
    
    console.log(`📊 Total brand contacts in database: ${totalBrands}`);
    
  } catch (error) {
    console.error('❌ Error adding brand contacts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addBrandContacts();