const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createNewUser() {
  try {
    // Use the correct Clerk user ID from the webhook data
    const clerkUserId = 'user_2udXwXwtfuPWmErTeBCRfVRe4jH'; // New user from webhook
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { user_id: clerkUserId }
    });
    
    if (existingUser) {
      console.log('User already exists:', existingUser);
      return existingUser;
    }
    
    // Create the user with data from the webhook
    const user = await prisma.user.create({
      data: {
        email: 'get.rishi@gmail.com',
        first_name: 'testuser', // Using username as first name since first_name is null
        last_name: '',
        profile_image_url: 'https://www.gravatar.com/avatar?d=mp',
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

createNewUser(); 