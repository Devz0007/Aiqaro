// src/app/api/preferences/[userId]/route.ts
import { PrismaClient } from '@prisma/client';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  StudyPhase,
  StudyStatus,
  THERAPEUTIC_AREAS,
} from '@/types/clinical-trials/filters';

const prisma = new PrismaClient();

// Extract therapeuticArea values for Zod validation
const TherapeuticAreasEnum = z.enum(
  THERAPEUTIC_AREAS.map((area) => area.value) as [string, ...string[]]
);

// Enforce enums for validation
const UserPreferenceSchema = z.object({
  areas: z.array(z.string()).optional(),
  phases: z.array(z.string()).optional(),
  statuses: z.array(z.string()).optional(),
  gender: z.string().optional(),
  minAge: z.number().optional(),
  maxAge: z.number().optional(),
  location: z.string().optional(),
});

// Validate userId as a string
const UserIdSchema = z.string().min(1, "User ID cannot be empty");

// Updated route handler for GET
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
): Promise<Response> {
  console.log(`[PREFERENCES] GET request for user ID: ${params.userId}`);
  const userId = params.userId;

  try {
    const userPreferences = await prisma.user_study_preferences.findUnique({
      where: { userId },
    });

    if (!userPreferences) {
      // Check if the user exists first
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
      });

      if (!user) {
        console.log(`[PREFERENCES] User ${userId} not found, attempting to create automatically`);
        
        // Get the authenticated user from Clerk
        const clerkUser = await currentUser();
        
        // Verify that the requested user_id matches the authenticated user
        if (!clerkUser || clerkUser.id !== userId) {
          console.error(`[PREFERENCES] Auth user ID doesn't match requested user ID (${userId})`);
          return NextResponse.json(
            { error: 'User not found and auto-creation not authorized' },
            { status: 404 }
          );
        }
        
        try {
          // Create the user with information from Clerk
          await prisma.user.create({
            data: {
              user_id: userId,
              email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@placeholder.com`,
              first_name: clerkUser.firstName || '',
              last_name: clerkUser.lastName || '',
              profile_image_url: clerkUser.imageUrl || '',
            },
          });
          
          console.log(`[PREFERENCES] User ${userId} created automatically`);
          
          // Still return 404 since preferences don't exist yet
          return NextResponse.json(
            { error: 'User preferences not found, but user was created' },
            { status: 404 }
          );
        } catch (createError) {
          console.error(`[PREFERENCES] Error auto-creating user:`, createError);
          return NextResponse.json(
            { error: 'User not found and auto-creation failed' },
            { status: 404 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'User preferences not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(userPreferences);
  } catch (error) {
    console.error(`[PREFERENCES] Error fetching preferences:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch user preferences' },
      { status: 500 }
    );
  }
}

// Updated route handler for POST
export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
): Promise<Response> {
  console.log(`[PREFERENCES] POST request for user ID: ${params.userId}`);
  const userId = params.userId;

  try {
    // Check if user exists first
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      console.log(`[PREFERENCES] User ${userId} not found, attempting to create automatically`);
      
      // Get the authenticated user from Clerk
      const clerkUser = await currentUser();
      
      if (!clerkUser || clerkUser.id !== userId) {
        console.error(`[PREFERENCES] Auth user ID doesn't match requested user ID (${userId})`);
        return NextResponse.json(
          { error: 'User not found and auto-creation not authorized' },
          { status: 404 }
        );
      }
      
      try {
        // Create the user first
        await prisma.user.create({
          data: {
            user_id: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@placeholder.com`,
            first_name: clerkUser.firstName || '',
            last_name: clerkUser.lastName || '',
            profile_image_url: clerkUser.imageUrl || '',
          },
        });
        
        console.log(`[PREFERENCES] User ${userId} created automatically before saving preferences`);
      } catch (createError) {
        console.error(`[PREFERENCES] Error auto-creating user:`, createError);
        return NextResponse.json(
          { error: 'Failed to create user before saving preferences' },
          { status: 500 }
        );
      }
    }

    // Parse and validate the request body
    const body = await request.json();
    let data;
    try {
      data = UserPreferenceSchema.parse(body);
    } catch (validationError) {
      console.error(`[PREFERENCES] Validation error:`, validationError);
      return NextResponse.json(
        { error: 'Invalid preference data' },
        { status: 400 }
      );
    }

    // Now save the preferences
    try {
      const preferences = await prisma.user_study_preferences.upsert({
        where: { userId },
        update: { 
          ...data,
          updatedAt: new Date() 
        },
        create: { 
          userId,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        },
      });

      console.log(`[PREFERENCES] Preferences saved for user ${userId}`);
      return NextResponse.json(preferences);
    } catch (saveError) {
      console.error(`[PREFERENCES] Error saving preferences:`, saveError);
      return NextResponse.json(
        { error: 'Failed to save preferences', details: String(saveError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`[PREFERENCES] Unexpected error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}