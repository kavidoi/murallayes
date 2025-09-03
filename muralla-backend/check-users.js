const { PrismaClient } = require("@prisma/client");

async function checkUsers() {
  const prisma = new PrismaClient();
  
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
        role: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log("Found users:");
    console.log(JSON.stringify(users, null, 2));
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
