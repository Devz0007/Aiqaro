// src/app/api/preferences/[user_id]/route.ts
import { PrismaClient } from '@prisma/client';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  StudyPhase,
  StudyStatus,
  THERAPEUTIC_AREAS,
} from '@/types/clinical-trials/filters';

// Use a singleton pattern for Prisma to avoid too many connections
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to prevent multiple instances
  const globalWithPrisma = global as typeof globalThis & {
    prisma: PrismaClient;
  };
  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient();
  }
  prisma = globalWithPrisma.prisma;
}

// Extract therapeuticArea values for Zod validation
const TherapeuticAreasEnum = z.enum(
  THERAPEUTIC_AREAS.map((area) => area.value) as [string, ...string[]]
);

// Enforce enums for validation - FIX THE FIELD NAMES TO MATCH DATABASE
const UserPreferenceSchema = z.object({
  phase: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  therapeuticArea: z.array(z.string()).optional(),
});

// Validate user_id as a string
const UserIdSchema = z.string().min(1, "User ID cannot be empty");

// Updated route handler for GET
export async function GET(
  request: Request,
  context: { params: { user_id: string } }
): Promise<Response> {
  try {
    // Correctly access params properly (no need to await, just use context)
    const user_id = context.params.user_id;
    // Reduce logging to one line
    console.log(`[PREFERENCES API] GET request for user ID: ${user_id}`);

    // Find user preferences using userId field in the DB
    const userPreferences = await prisma.user_study_preferences.findUnique({
      where: { userId: user_id },
    });
    
    if (!userPreferences) {
      // Check if the user exists first
      const user = await prisma.user.findUnique({
        where: { user_id },
      });

      if (!user) {
        // Get the authenticated user from Clerk
        const clerkUser = await currentUser();
        
        // Verify that the requested user_id matches the authenticated user
        if (!clerkUser || clerkUser.id !== user_id) {
          return NextResponse.json(
            { error: 'User not found and auto-creation not authorized' },
            { status: 404 }
          );
        }
        
        try {
          // Create the user with information from Clerk
          await prisma.user.create({
            data: {
              user_id,
              email: clerkUser.emailAddresses[0]?.emailAddress || `${user_id}@placeholder.com`,
              first_name: clerkUser.firstName || '',
              last_name: clerkUser.lastName || '',
              profile_image_url: clerkUser.imageUrl || '',
            },
          });
          
          console.log(`[PREFERENCES API] User ${user_id} created automatically`);
          
          // Still return 404 since preferences don't exist yet
          return NextResponse.json(
            { error: 'User preferences not found, but user was created' },
            { status: 404 }
          );
        } catch (createError) {
          console.error(`[PREFERENCES API] Error auto-creating user:`, createError);
          return NextResponse.json(
            { error: 'User not found and auto-creation failed' },
            { status: 404 }
          );
        }
      }
      
      console.log('[PREFERENCES API] Returning 404 - preferences not found');
      return NextResponse.json(
        { error: 'User preferences not found' },
        { status: 404 }
      );
    }

    // Format the preferences to match the expected structure
    const formattedPreferences = {
      phase: userPreferences.phase || [],
      status: userPreferences.status || [],
      therapeuticArea: userPreferences.therapeuticArea || [],
      // Add other fields as needed
    };

    return NextResponse.json(formattedPreferences);
  } catch (error) {
    console.error(`[PREFERENCES API] Error fetching preferences:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch user preferences', details: String(error) },
      { status: 500 }
    );
  }
}

// Updated route handler for POST
export async function POST(
  request: Request,
  context: { params: { user_id: string } }
): Promise<Response> {
  try {
    // Correctly access params properly
    const user_id = context.params.user_id;
    // Single log line for POST request
    console.log(`[PREFERENCES API] POST request for user ID: ${user_id}`);

    // Check if user exists first
    const user = await prisma.user.findUnique({
      where: { user_id },
    });

    if (!user) {
      // Get the authenticated user from Clerk
      const clerkUser = await currentUser();
      
      if (!clerkUser || clerkUser.id !== user_id) {
        return NextResponse.json(
          { error: 'User not found and auto-creation not authorized' },
          { status: 404 }
        );
      }
      
      try {
        // Create the user first
        const newUser = await prisma.user.create({
          data: {
            user_id,
            email: clerkUser.emailAddresses[0]?.emailAddress || `${user_id}@placeholder.com`,
            first_name: clerkUser.firstName || '',
            last_name: clerkUser.lastName || '',
            profile_image_url: clerkUser.imageUrl || '',
          },
        });
        
        console.log(`[PREFERENCES API] User ${user_id} created automatically before saving preferences`, newUser);
      } catch (createError) {
        console.error(`[PREFERENCES API] Error auto-creating user:`, createError);
        return NextResponse.json(
          { error: 'Failed to create user before saving preferences', details: String(createError) },
          { status: 500 }
        );
      }
    }

    // Parse and validate the request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error(`[PREFERENCES API] Error parsing request body:`, parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: String(parseError) },
        { status: 400 }
      );
    }
    
    let data;
    try {
      data = UserPreferenceSchema.parse(body);
    } catch (validationError) {
      console.error(`[PREFERENCES API] Validation error:`, validationError);
      return NextResponse.json(
        { error: 'Invalid preference data', details: String(validationError) },
        { status: 400 }
      );
    }

    // Now save the preferences
    try {
      const preferences = await prisma.user_study_preferences.upsert({
        where: { userId: user_id },
        update: { 
          ...data,
          updatedAt: new Date() 
        },
        create: {
          userId: user_id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        },
      });
      
      // Return formatted preferences
      const formattedPreferences = {
        phase: preferences.phase || [],
        status: preferences.status || [],
        therapeuticArea: preferences.therapeuticArea || [],
      };
      
      return NextResponse.json(formattedPreferences);
    } catch (saveError) {
      console.error(`[PREFERENCES API] Error saving preferences:`, saveError);
      return NextResponse.json(
        { error: 'Failed to save preferences', details: String(saveError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`[PREFERENCES API] Unexpected error:`, error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}