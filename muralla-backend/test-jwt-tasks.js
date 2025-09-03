const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testJwtTasks() {
  try {
    console.log('🔐 Testing JWT Authentication and Tasks Endpoint...\n');
    
    // Test 1: Check if we can find a user to create a token for
    console.log('1️⃣ Finding a user for JWT token...');
    const user = await prisma.user.findFirst({
      where: { isDeleted: false }
    });
    
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log('✅ Found user:', user.username);
    
    // Test 2: Create a JWT token
    console.log('\n2️⃣ Creating JWT token...');
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { 
        sub: user.id, 
        username: user.username, 
        role: user.role || 'admin' 
      },
      secret,
      { expiresIn: '1h' }
    );
    
    console.log('✅ JWT token created');
    console.log('Token:', token.substring(0, 50) + '...');
    
    // Test 3: Test the tasks endpoint with the token
    console.log('\n3️⃣ Testing tasks endpoint with JWT token...');
    
    const response = await fetch('http://localhost:4000/tasks', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Tasks endpoint successful');
      console.log('Found', Array.isArray(data) ? data.length : 'unknown number of', 'tasks');
    } else {
      const errorData = await response.text();
      console.log('❌ Tasks endpoint failed');
      console.log('Error response:', errorData);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testJwtTasks();
