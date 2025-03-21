// This won't work directly in Node.js as Clerk is a client-side library
// Instead, add this code to a component in your app to debug the current user

/*
import { useUser } from '@clerk/nextjs';

export default function UserDebug() {
  const { user } = useUser();
  
  if (!user) return <div>Not logged in</div>;
  
  // Log user details to console
  console.log('Current Clerk User:', {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName
  });
  
  return (
    <div>
      <h1>User Debug</h1>
      <p>User ID: {user.id}</p>
      <p>Email: {user.primaryEmailAddress?.emailAddress}</p>
      <p>Name: {user.firstName} {user.lastName}</p>
    </div>
  );
}
*/

// For checking the database user directly with Prisma:
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    // Get all users
    const users = await prisma.user.findMany();
    console.log('All users in database:', users);
    
    // Get all user study preferences
    const preferences = await prisma.user_study_preferences.findMany();
    console.log('All preferences in database:', preferences);
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers(); 