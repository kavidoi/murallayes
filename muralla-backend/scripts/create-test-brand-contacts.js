const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestBrandContacts() {
  try {
    console.log('Creating test brand and contacts...');

    // First, create a test brand
    const brand = await prisma.brand.create({
      data: {
        name: 'Test Brand Co.',
        description: 'A test brand for contact functionality',
        website: 'https://testbrand.com',
        isActive: true,
      }
    });

    console.log('Created brand:', brand);

    // Create some brand contacts
    const contacts = await Promise.all([
      prisma.brandContact.create({
        data: {
          brandId: brand.id,
          name: 'John Smith',
          role: 'Sales Manager',
          email: 'john.smith@testbrand.com',
          phone: '+1-555-0123',
          skuAbbreviation: 'TB-JS',
          isPrimary: true,
          isActive: true,
        }
      }),
      prisma.brandContact.create({
        data: {
          brandId: brand.id,
          name: 'Jane Doe',
          role: 'Product Manager',
          email: 'jane.doe@testbrand.com',
          phone: '+1-555-0124',
          skuAbbreviation: 'TB-JD',
          isPrimary: false,
          isActive: true,
        }
      }),
      prisma.brandContact.create({
        data: {
          brandId: brand.id,
          name: 'Bob Johnson',
          role: 'Account Executive',
          email: 'bob.johnson@testbrand.com',
          phone: '+1-555-0125',
          skuAbbreviation: 'TB-BJ',
          isPrimary: false,
          isActive: true,
        }
      })
    ]);

    console.log('Created contacts:', contacts.length);
    contacts.forEach(contact => {
      console.log(`- ${contact.name} (${contact.role})`);
    });

    console.log('\n✅ Test brand contacts created successfully!');
    console.log('You can now test the contacts endpoint:');
    console.log('curl -X GET "http://localhost:4000/brands/contacts/available-for-supplier"');

  } catch (error) {
    console.error('Error creating test brand contacts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestBrandContacts();