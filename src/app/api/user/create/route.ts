import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for user creation
const UserCreateSchema = z.object({
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  profile_image_url: z.string().url().optional(),
  user_id: z.string(),
  // Optional API key for security
  api_key: z.string().optional(),
});

export async function POST(request: Request) {
  console.log('[MANUAL_CREATE] Received request to create user');
  
  try {
    // Parse and validate the request body
    const body = await request.json();
    const { email, first_name, last_name, profile_image_url, user_id, api_key } = UserCreateSchema.parse(body);
    
    // Basic security check - in production you'd want a more robust solution
    // Uncomment and set an API key in your environment variables for basic security
    /*
    if (api_key !== process.env.USER_CREATE_API_KEY) {
      console.error('[MANUAL_CREATE] Invalid API key');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    */
    
    console.log('[MANUAL_CREATE] Creating user:', { email, user_id });
    
    // Create a new Prisma client
    const prisma = new PrismaClient();
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { user_id }
    });
    
    if (existingUser) {
      console.log('[MANUAL_CREATE] User already exists:', existingUser);
      await prisma.$disconnect();
      return NextResponse.json({ 
        success: true, 
        message: 'User already exists',
        data: existingUser
      });
    }
    
    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        first_name: first_name || '',
        last_name: last_name || '',
        profile_image_url: profile_image_url || '',
        user_id,
      }
    });
    
    console.log('[MANUAL_CREATE] User created successfully:', user);
    
    // Close the Prisma connection
    await prisma.$disconnect();
    
    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    console.error('[MANUAL_CREATE] Error creating user:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create user', 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Optionally add a GET method to check if a user exists by ID
export async function GET(request: Request) {
  const url = new URL(request.url);
  const user_id = url.searchParams.get('user_id');
  
  if (!user_id) {
    return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 });
  }
  
  try {
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
      where: { user_id }
    });
    
    await prisma.$disconnect();
    
    if (!user) {
      return NextResponse.json({ exists: false }, { status: 404 });
    }
    
    return NextResponse.json({ exists: true, user });
  } catch (error) {
    console.error('[MANUAL_CREATE] Error checking user:', error);
    return NextResponse.json({ 
      error: 'Failed to check user', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 