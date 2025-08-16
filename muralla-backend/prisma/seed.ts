import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

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
      role: { connect: { id: staffRole.id } },
      isActive: true,
    },
    create: {
      email: 'darwin@murallacafe.cl',
      username: 'darwin',
      firstName: 'Darwin',
      lastName: 'Bruna',
      password: staffPasswordHash,
      role: { connect: { id: staffRole.id } },
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'kavi@murallacafe.cl' },
    update: {
      firstName: 'Kaví',
      lastName: 'Doi',
      username: 'kavi',
      role: { connect: { id: staffRole.id } },
      isActive: true,
    },
    create: {
      email: 'kavi@murallacafe.cl',
      username: 'kavi',
      firstName: 'Kaví',
      lastName: 'Doi',
      password: staffPasswordHash,
      role: { connect: { id: staffRole.id } },
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'contacto@murallacafe.cl' },
    update: {},
    create: {
      email: 'contacto@murallacafe.cl',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      password: passwordHash,
      role: {
        connect: { id: adminRole.id },
      },
    },
  });

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
