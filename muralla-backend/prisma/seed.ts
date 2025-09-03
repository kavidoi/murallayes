import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash('Muralla2025', 10);

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full permissions',
      permissions: [
        'projects.manage',
        'tasks.manage',
        'knowledge.manage',
        'inventory.manage',
        'finance.manage',
        'users.manage',
      ],
    },
  });

  // Create staff role for regular employees
  const staffRole = await prisma.role.upsert({
    where: { name: 'staff' },
    update: {},
    create: {
      name: 'staff',
      description: 'Standard team member access',
      permissions: [
        'projects.read',
        'tasks.read',
        'documents.read',
        'inventory.read',
        'finance.read',
      ],
    },
  });

  // Default password for staff users
  const staffPasswordHash = await bcrypt.hash('muralla123', 10);

  // Upsert real staff members: Darwin Bruna and Kaví Doi
  await prisma.user.upsert({
    where: { email: 'darwin@murallacafe.cl' },
    update: {
      firstName: 'Darwin',
      lastName: 'Bruna',
      username: 'darwin',
      role: { connect: { id: adminRole.id } },
      password: adminPasswordHash,
      isActive: true,
    },
    create: {
      email: 'darwin@murallacafe.cl',
      username: 'darwin',
      firstName: 'Darwin',
      lastName: 'Bruna',
      password: adminPasswordHash,
      role: { connect: { id: adminRole.id } },
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'kavi@murallacafe.cl' },
    update: {
      firstName: 'Kaví',
      lastName: 'Doi',
      username: 'kavi',
      role: { connect: { id: adminRole.id } },
      password: adminPasswordHash,
      isActive: true,
    },
    create: {
      email: 'kavi@murallacafe.cl',
      username: 'kavi',
      firstName: 'Kaví',
      lastName: 'Doi',
      password: adminPasswordHash,
      role: { connect: { id: adminRole.id } },
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'contacto@murallacafe.cl' },
    update: {
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      password: adminPasswordHash,
      role: {
        connect: { id: adminRole.id },
      },
      isActive: true,
    },
    create: {
      email: 'contacto@murallacafe.cl',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      password: adminPasswordHash,
      role: {
        connect: { id: adminRole.id },
      },
    },
  });

  // Create Product Categories
  const categories = [
    { id: 'alfajor-cat', name: 'Alfajor', code: 'ALF', description: 'Alfajores dulces', emoji: '🍪', color: '#8B4513' },
    { id: 'galleta-cat', name: 'Galleta', code: 'GALL', description: 'Galletas variadas', emoji: '🍪', color: '#DEB887' },
    { id: 'galleta-corazon-cat', name: 'Galleta Corazón', code: 'GACO', description: 'Galletas con forma de corazón', emoji: '💖', color: '#FF69B4' },
    { id: 'delicia-cat', name: 'Delicia', code: 'DEL', description: 'Delicias dulces', emoji: '🧁', color: '#FFB6C1' },
    { id: 'galleta-corazon-mantequilla-cat', name: 'Mantequilla', code: 'MTQ', description: 'Productos con mantequilla', emoji: '🧈', color: '#FFD700' },
    { id: 'kombucha-cat', name: 'Kombucha', code: 'KBCH', description: 'Bebidas de kombucha', emoji: '🍵', color: '#228B22' },
    { id: 'barras-cat', name: 'Barras', code: 'BR', description: 'Barras energéticas y cereales', emoji: '🍫', color: '#8B4513' },
    { id: 'agua-cat', name: 'Agua', code: 'AG', description: 'Agua y bebidas hidratantes', emoji: '💧', color: '#4169E1' },
    { id: 'agua-bidon-cat', name: 'Agua Bidón', code: 'AGBI', description: 'Agua en bidón', emoji: '🚰', color: '#00CED1' },
    { id: 'electrolitos-cat', name: 'Electrolitos', code: 'ELCT', description: 'Bebidas con electrolitos', emoji: '⚡', color: '#FF4500' },
    { id: 'agua-chia-cat', name: 'Agua Chía', code: 'AGCH', description: 'Agua con semillas de chía', emoji: '🌱', color: '#32CD32' },
    { id: 'almuerzo-conserva-cat', name: 'Almuerzo Conserva', code: 'ALCON', description: 'Almuerzos en conserva', emoji: '🥫', color: '#CD853F' },
    { id: 'muffie-cat', name: 'Muffie', code: 'MUF', description: 'Muffins variados', emoji: '🧁', color: '#DA70D6' },
    { id: 'rollo-cat', name: 'Rollo', code: 'ROLL', description: 'Rollos de canela y dulces', emoji: '🥨', color: '#D2691E' },
    { id: 'helado-cat', name: 'Helado', code: 'HEL', description: 'Helados y postres congelados', emoji: '🍦', color: '#FFB6C1' },
    { id: 'snickers-cat', name: 'Snickers', code: 'SNK', description: 'Barras tipo Snickers', emoji: '🍫', color: '#8B4513' },
    { id: 'chocolate-submarino-cat', name: 'Chocolate Submarino', code: 'CHSUB', description: 'Chocolate para preparar en leche', emoji: '🍫', color: '#654321' }
  ];

  for (const category of categories) {
    await prisma.productCategory.upsert({
      where: { id: category.id },
      update: {},
      create: category,
    });
  }

  // Create Brands and Brand Contacts
  const brandsData = [
    { code: 'BNK', name: 'Brisnacks' },
    { code: 'SMT', name: 'Smutter' },
    { code: 'DKK', name: 'Dr Combu Kombucha' },
    { code: 'SHF', name: 'Super Human Foods' },
    { code: 'AESC', name: 'Agua Escencial' },
    { code: 'AMZC', name: 'Amazing Care' },
    { code: 'BNDT', name: 'Benedictino' },
    { code: 'BNTR', name: 'Binatur' },
    { code: 'CMFR', name: 'Comida en Frasco' },
    { code: 'MAV', name: 'Mis Amigos Veganos' },
    { code: 'SSNK', name: 'Sole Snickers' },
    { code: 'AMCH', name: 'AM Chocolates' }
  ];

  for (const brandData of brandsData) {
    // Create or find the brand first
    const brand = await prisma.brand.upsert({
      where: { name: brandData.name },
      update: {},
      create: {
        name: brandData.name,
        description: `Brand for ${brandData.name}`,
        isActive: true,
      },
    });

    // Check if brand contact already exists
    const existingContact = await prisma.brandContact.findFirst({
      where: {
        brandId: brand.id,
        name: brandData.name,
      },
    });

    if (!existingContact) {
      // Create new contact
      await prisma.brandContact.create({
        data: {
          brandId: brand.id,
          name: brandData.name,
          role: 'Marca',
          skuAbbreviation: brandData.code,
          isPrimary: true,
          isActive: true,
        },
      });
    }
  }

  console.log('Seed completed ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
