const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Use the correct Clerk user ID from the error logs
    const clerkUserId = 'user_2uFA9fiKkoQAdufrMgdzV5trjmq';
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { user_id: clerkUserId }
    });
    
    if (existingUser) {
      console.log('User already exists:', existingUser);
      return existingUser;
    }
    
    // Create the user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com', // Use a placeholder email
        first_name: 'Test',
        last_name: 'User',
        profile_image_url: 'https://example.com/profile.jpg',
        user_id: clerkUserId
      }
    });
    
    console.log('Created user:', user);
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser(); 