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
const UserIdSchema = z.string();

// Updated route handler for GET
export async function GET(
  request: Request,
  context: {
    params: Promise<{
      userId: string;
    }>;
  }
): Promise<Response> {

  try {
    const { userId } = await context.params; // Access params asynchronously
    const validatedUserId = UserIdSchema.parse(userId);
    const preferences = await prisma.user_study_preferences.findUnique({
      where: { userId: validatedUserId },
    });
    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error in fetching preferences: ', error);
    return NextResponse.json(
      { error: error instanceof z.ZodError ? error.errors : 'Invalid request' },
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
    const { userId } = await context.params; // Access params asynchronously

    // Validate userId
    const validatedUserId = UserIdSchema.parse(userId);

    // Safely parse and validate request body
    const data = UserPreferenceSchema.parse(await request.json());

    // Upsert preferences
    const preferences = await prisma.user_study_preferences.upsert({
      where: { userId: validatedUserId },
      update: data,
      create: { userId: validatedUserId, ...data },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error in setting preferences: ', error);
    return NextResponse.json(
      { error: error instanceof z.ZodError ? error.errors : 'Invalid request' },
      { status: 400 }
    );
  }
}
