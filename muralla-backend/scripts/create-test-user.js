#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');

// Load environment variables from .env file
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const envLines = envContent.split('\n');
  envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key] = valueParts.join('=').replace(/"/g, '');
    }
  });
}

const prisma = new PrismaClient();

/**
 * Create Test User Script
 * Creates a demo user for testing the frontend authentication
 */

async function createTestUser() {
  try {
    console.log('🔄 Creating test user...');
    
    // Check if test user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: 'admin@muralla.com',
        isDeleted: false
      }
    });
    
    if (existingUser) {
      console.log('✅ Test user already exists:');
      console.log(`  📧 Email: ${existingUser.email}`);
      console.log(`  👤 Name: ${existingUser.firstName} ${existingUser.lastName}`);
      console.log(`  🔑 Password: admin123`);
      console.log('');
      console.log('You can now log in to the frontend using these credentials.');
      return;
    }
    
    // Create default role if it doesn't exist
    let adminRole = await prisma.role.findFirst({
      where: { name: 'admin' }
    });
    
    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: 'admin',
          description: 'Administrator role with full access',
          permissions: [
            'users:read', 'users:write', 'users:delete',
            'projects:read', 'projects:write', 'projects:delete',
            'tasks:read', 'tasks:write', 'tasks:delete',
            'finance:read', 'finance:write',
            'inventory:read', 'inventory:write',
            'knowledge:read', 'knowledge:write',
            'notifications:read', 'notifications:write'
          ],
          tenantId: 'default-tenant'
        }
      });
      console.log('✅ Created admin role');
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@muralla.com',
        username: 'admin',
        password: hashedPassword,
        isActive: true,
        roleId: adminRole.id,
        tenantId: 'default-tenant'
      },
      include: {
        role: true
      }
    });
    
    console.log('✅ Test user created successfully!');
    console.log('');
    console.log('📧 Login credentials:');
    console.log(`  Email: ${testUser.email}`);
    console.log(`  Username: ${testUser.username}`);
    console.log(`  Password: admin123`);
    console.log(`  Role: ${testUser.role.name}`);
    console.log('');
    console.log('🚀 You can now log in to the frontend using these credentials.');
    console.log('   Frontend URL: http://localhost:5173');
    console.log('   Backend URL: http://localhost:4000');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createTestUser();
}