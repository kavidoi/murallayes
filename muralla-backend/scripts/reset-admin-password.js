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

async function resetAdminPasswords() {
  try {
    console.log('🔄 Resetting admin passwords...');
    
    // Find all admin users
    const adminEmails = [
      'contacto@murallacafe.cl',
      'darwin@murallacafe.cl', 
      'kavi@murallacafe.cl'
    ];
    
    const adminUsers = await prisma.user.findMany({
      where: {
        email: { in: adminEmails },
        isDeleted: false
      }
    });
    
    if (adminUsers.length === 0) {
      console.error('❌ No admin users found');
      return;
    }
    
    // Hash new password
    const newPassword = 'Muralla2025';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update all admin passwords
    const updatePromises = adminUsers.map(user =>
      prisma.user.update({
        where: { id: user.id },
        data: { 
          password: hashedPassword,
          isActive: true 
        }
      })
    );
    
    await Promise.all(updatePromises);
    
    console.log('✅ Admin passwords reset successfully!');
    console.log('');
    console.log('📧 Updated login credentials:');
    adminUsers.forEach(user => {
      console.log(`  Email: ${user.email}`);
      console.log(`  Username: ${user.username || user.email}`);
      console.log(`  Password: ${newPassword}`);
      console.log('');
    });
    console.log('🚀 You can now log in to the frontend with any of these accounts.');
    
  } catch (error) {
    console.error('❌ Error resetting passwords:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  resetAdminPasswords();
}