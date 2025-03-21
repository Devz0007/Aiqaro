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
    const validatedUserId = UserIdSchema.parse(userId);

    // Get and log the request body
    const body = await request.json();
    const data = UserPreferenceSchema.parse(body);

    // Upsert preferences
    const preferences = await prisma.user_study_preferences.upsert({
      where: { userId: validatedUserId },
      update: data,
      create: { userId: validatedUserId, ...data },
    });

    return NextResponse.json(preferences);
  } catch (error) {
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