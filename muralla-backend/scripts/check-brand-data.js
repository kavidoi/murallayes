const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBrandData() {
  try {
    console.log('Checking existing brand data...');

    // Check brands
    const brands = await prisma.brand.findMany({
      include: {
        contacts: true,
        _count: {
          select: {
            contacts: true
          }
        }
      }
    });
    
    console.log(`\nFound ${brands.length} brands:`);
    brands.forEach(brand => {
      console.log(`- ${brand.name} (${brand._count.contacts} contacts)`);
    });

    // Check brand contacts specifically
    const contacts = await prisma.brandContact.findMany({
      include: {
        brand: true
      }
    });

    console.log(`\nFound ${contacts.length} brand contacts:`);
    contacts.forEach(contact => {
      console.log(`- ${contact.name} (${contact.role}) at ${contact.brand?.name || 'Unknown Brand'}`);
    });

    // Test the specific query used in the service
    console.log('\nTesting service query...');
    const availableContacts = await prisma.brandContact.findMany({
      where: {
        isActive: true,
      },
      include: {
        brand: true
      },
      orderBy: [
        { name: 'asc' }
      ]
    });

    console.log(`Service query returns ${availableContacts.length} contacts`);

  } catch (error) {
    console.error('Error checking brand data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBrandData();