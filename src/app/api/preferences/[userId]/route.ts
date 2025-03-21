// src/app/api/preferences/[userId]/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  StudyPhase,
  StudyStatus,
  THERAPEUTIC_AREAS,
} from '@/types/clinical-trials/filters';
import { prisma } from '@/utils/data/client/prima';

// Extract therapeuticArea values for Zod validation
const TherapeuticAreasEnum = z.enum(
  THERAPEUTIC_AREAS.map((area) => area.value) as [string, ...string[]]
);

// Enforce enums for validation
const UserPreferenceSchema = z.object({
  phase: z.array(z.nativeEnum(StudyPhase)).optional(),
  status: z.array(z.nativeEnum(StudyStatus)).optional(),
  therapeuticArea: z.array(TherapeuticAreasEnum).optional(),
});

// Validate userId as a string
const UserIdSchema = z.string().min(1, "User ID cannot be empty");


// Updated route handler for GET
export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      userId: string;
    }>;
  }
): Promise<Response> {
  try {
    const { userId } = await context.params;
    console.log('GET - Received userId:', userId);

    const validatedUserId = UserIdSchema.parse(userId);
    console.log('GET - Validated userId:', validatedUserId);

    const preferences = await prisma.user_study_preferences.findUnique({
      where: { userId: validatedUserId },
    });
    
    console.log('GET - Retrieved preferences:', preferences);

    if (!preferences) {
      console.log('GET - No preferences found for user:', validatedUserId);
      return NextResponse.json(
        { error: 'Preferences not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error in fetching preferences:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      zodError: error instanceof z.ZodError ? error.errors : undefined
    });
    
    return NextResponse.json(
      { 
        error: error instanceof z.ZodError 
          ? { type: 'validation', errors: error.errors }
          : { type: 'unknown', message: 'Invalid request' }
      },
      { status: 400 }
    );
  }
}

// Updated route handler for POST
export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> }
): Promise<Response> {
  try {
    const { userId } = await context.params;
    console.log('POST - Received userId:', userId);

    // Validate userId
    const validatedUserId = UserIdSchema.parse(userId);
    console.log('POST - Validated userId:', validatedUserId);

    // Get and log the request body
    const body = await request.json();
    console.log('POST - Received body:', body);

    // Safely parse and validate request body
    const data = UserPreferenceSchema.parse(body);
    console.log('POST - Validated data:', data);

    // Upsert preferences
    const preferences = await prisma.user_study_preferences.upsert({
      where: { userId: validatedUserId },
      update: data,
      create: { userId: validatedUserId, ...data },
    });

    console.log('POST - Saved preferences:', preferences);

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error in setting preferences:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      zodError: error instanceof z.ZodError ? error.errors : undefined
    });

    return NextResponse.json(
      { 
        error: error instanceof z.ZodError 
          ? { type: 'validation', errors: error.errors }
          : { type: 'unknown', message: 'Invalid request' }
      },
      { status: 400 }
    );
  }
}