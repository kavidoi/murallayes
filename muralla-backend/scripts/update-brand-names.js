const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const brandUpdates = [
  {
    oldName: "BRISNACKS",
    newName: "Brisnacks",
    newCompany: "Brisnacks"
  },
  {
    oldName: "SMUTTER",
    newName: "Smutter",
    newCompany: "Smutter"
  },
  {
    oldName: "DR COMBU KOMBUCHA",
    newName: "Dr. Combu Kombucha",
    newCompany: "Dr. Combu Kombucha"
  },
  {
    oldName: "SUPER HUMAN FOODS",
    newName: "Super Human Foods",
    newCompany: "Super Human Foods"
  },
  {
    oldName: "AGUA ESCENCIAL",
    newName: "Agua Escencial",
    newCompany: "Agua Escencial"
  },
  {
    oldName: "AMAZING CARE",
    newName: "Amazing Care",
    newCompany: "Amazing Care"
  },
  {
    oldName: "BENEDICTINO",
    newName: "Benedictino",
    newCompany: "Benedictino"
  },
  {
    oldName: "BINATUR",
    newName: "Binatur",
    newCompany: "Binatur"
  },
  {
    oldName: "COMIDA EN FRASCO",
    newName: "Comida en Frasco",
    newCompany: "Comida en Frasco"
  },
  {
    oldName: "MIS AMIGOS VEGANOS",
    newName: "Mis Amigos Veganos",
    newCompany: "Mis Amigos Veganos"
  },
  {
    oldName: "SOLE SNICKERS",
    newName: "Sole Snickers",
    newCompany: "Sole Snickers"
  },
  {
    oldName: "HANS ANDRESEN CHOCOLATES",
    newName: "Hans Andresen Chocolates",
    newCompany: "Hans Andresen Chocolates"
  }
];

async function updateBrandNames() {
  try {
    console.log('✏️ Updating brand contact names to proper case...');
    
    for (const update of brandUpdates) {
      try {
        // Find the contact by old name
        const contact = await prisma.contact.findFirst({
          where: {
            name: update.oldName,
            type: 'brand',
            isDeleted: false
          }
        });
        
        if (!contact) {
          console.log(`⚠️  Contact "${update.oldName}" not found, skipping...`);
          continue;
        }
        
        // Update the contact name and company
        await prisma.contact.update({
          where: {
            id: contact.id
          },
          data: {
            name: update.newName,
            company: update.newCompany,
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Updated: "${update.oldName}" → "${update.newName}"`);
      } catch (error) {
        console.error(`❌ Failed to update ${update.oldName}:`, error.message);
      }
    }
    
    console.log('\n🎉 Finished updating brand names!');
    
    // Show updated brands
    const brands = await prisma.contact.findMany({
      where: {
        type: 'brand',
        isDeleted: false
      },
      select: {
        name: true,
        skuAbbreviation: true,
        company: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log('\n🏷️ Updated Brand Names:');
    console.log('======================');
    brands.forEach(brand => {
      console.log(`${brand.skuAbbreviation?.padEnd(6) || 'N/A'.padEnd(6)} | ${brand.name}`);
    });
    console.log(`\n📊 Total: ${brands.length} brands`);
    
  } catch (error) {
    console.error('❌ Error updating brand names:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateBrandNames();