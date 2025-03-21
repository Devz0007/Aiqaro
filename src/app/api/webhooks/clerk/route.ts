// src/app/api/webhooks/clerk/route.ts
import { WebhookEvent } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';

import { userCreate } from '@/utils/data/user/user-create';
import { userUpdate } from '@/utils/data/user/user-update';
import { env } from 'data/env/server';

// Type-safe helper function to extract properties from unknown data
function safeGetString(obj: unknown, key: string): string | undefined {
  if (typeof obj === 'object' && obj !== null && key in obj) {
    const value = (obj as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

// Direct DB insert function as a fallback
async function directInsertUser(userData: {
  email: string;
  first_name: string;
  last_name: string;
  profile_image_url: string;
  user_id: string;
}) {
  console.log('[DIRECT_INSERT] Attempting direct user insert as fallback');
  
  try {
    // Import PrismaClient directly to bypass potential Supabase issues
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log('[DIRECT_INSERT] Checking if user already exists');
    const existingUser = await prisma.user.findUnique({
      where: { user_id: userData.user_id }
    });
    
    if (existingUser) {
      console.log('[DIRECT_INSERT] User already exists, skipping insert');
      await prisma.$disconnect();
      return { success: true, message: 'User already exists' };
    }
    
    console.log('[DIRECT_INSERT] Creating user with Prisma');
    const result = await prisma.user.create({
      data: {
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        profile_image_url: userData.profile_image_url,
        user_id: userData.user_id,
      }
    });
    
    console.log('[DIRECT_INSERT] User created successfully with Prisma', result);
    await prisma.$disconnect();
    return { success: true, data: result };
  } catch (error) {
    console.error('[DIRECT_INSERT] Error in direct insert:', error instanceof Error ? error.message : String(error));
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function POST(req: Request): Promise<Response> {
  console.log('[CLERK WEBHOOK] Request received');
  
  // Initial response to prevent timeouts
  const responseHeaders = {
    'Content-Type': 'application/json',
  };
  
  try {
    const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      console.error('[CLERK WEBHOOK] No webhook secret found in environment variables');
      return NextResponse.json(
        { error: 'Missing webhook secret' },
        { status: 400, headers: responseHeaders }
      );
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    console.log('[CLERK WEBHOOK] Headers received', { 
      svix_id_present: svix_id !== null && svix_id !== undefined && svix_id !== '',
      svix_timestamp_present: svix_timestamp !== null && svix_timestamp !== undefined && svix_timestamp !== '',
      svix_signature_present: svix_signature !== null && svix_signature !== undefined && svix_signature !== ''
    });

    if (
      svix_id === null || svix_id === undefined || svix_id === '' ||
      svix_timestamp === null || svix_timestamp === undefined || svix_timestamp === '' ||
      svix_signature === null || svix_signature === undefined || svix_signature === ''
    ) {
      console.error('[CLERK WEBHOOK] Missing svix headers');
      return NextResponse.json(
        { error: 'Missing svix headers' },
        { status: 400, headers: responseHeaders }
      );
    }
    
    // Get the body and handle 'any' type safely
    const rawPayload = await req.json() as Record<string, unknown>;
    
    // Type-safe access to nested properties
    const payloadType = safeGetString(rawPayload, 'type');
    let payloadDataId: string | undefined;
    
    if (typeof rawPayload.data === 'object' && rawPayload.data !== null) {
      payloadDataId = safeGetString(rawPayload.data as Record<string, unknown>, 'id');
    }
    
    console.log('[CLERK WEBHOOK] Raw payload received', { 
      type: payloadType,
      data_id: payloadDataId
    });
    
    const body = JSON.stringify(rawPayload);

    // Verify webhook signature
    try {
      console.log('[CLERK WEBHOOK] Attempting to verify webhook');
      const wh = new Webhook(WEBHOOK_SECRET);
      const evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent;
      
      console.log('[CLERK WEBHOOK] Verification successful');
      
      const eventType = evt.type;
      console.log(`[CLERK WEBHOOK] Event type: ${eventType}`);
      
      // Handle the event based on type
      if (eventType === 'user.created') {
        // Extract email with validation
        const email = evt.data.email_addresses?.[0]?.email_address ?? '';
        if (!email) {
          console.error('[CLERK WEBHOOK] No email address found in payload');
          return NextResponse.json(
            { error: 'No email address found' },
            { status: 400, headers: responseHeaders }
          );
        }

        // Extract user_id with validation
        const user_id = evt.data.id ?? '';
        if (!user_id) {
          console.error('[CLERK WEBHOOK] No user ID found in payload');
          return NextResponse.json(
            { error: 'No user ID found' },
            { status: 400, headers: responseHeaders }
          );
        }

        // Handle profile data with fallbacks for missing fields
        const first_name = evt.data.first_name || evt.data.username || '';
        const last_name = evt.data.last_name || '';
        const profile_image_url = evt.data.image_url || '';
        
        const userData = {
          email,
          first_name,
          last_name,
          profile_image_url,
          user_id,
        };
        
        console.log('[CLERK WEBHOOK] Environment variables check:', { 
          supabase_url: env.SUPABASE_URL ?? '',
          supabase_key_present: env.SUPABASE_SERVICE_KEY !== undefined && env.SUPABASE_SERVICE_KEY !== ''
        });
        
        try {
          console.log('[CLERK WEBHOOK] Attempting to create user with Supabase');
          const result = await userCreate(userData);
          console.log('[CLERK WEBHOOK] User creation result:', result);
          
          // Return success
          return NextResponse.json(
            { success: true, message: 'User created successfully' },
            { status: 200, headers: responseHeaders }
          );
        } catch (supabaseError: unknown) {
          console.error('[CLERK WEBHOOK] Supabase user creation failed, trying direct Prisma insert', {
            error: supabaseError instanceof Error ? supabaseError.message : String(supabaseError)
          });
          
          // Try direct Prisma insert as fallback
          const directResult = await directInsertUser(userData);
          
          if (directResult.success) {
            console.log('[CLERK WEBHOOK] Direct insert successful');
            return NextResponse.json(
              { success: true, message: 'User created successfully via direct insert' },
              { status: 200, headers: responseHeaders }
            );
          } else {
            console.error('[CLERK WEBHOOK] Both Supabase and direct insert failed');
            return NextResponse.json(
              { 
                error: 'Failed to create user', 
                supabaseError: supabaseError instanceof Error ? supabaseError.message : 'Unknown error',
                directError: directResult.error
              },
              { status: 500, headers: responseHeaders }
            );
          }
        }
      } else if (eventType === 'user.updated') {
        // Extract email with validation
        const email = evt.data.email_addresses?.[0]?.email_address ?? '';
        if (!email) {
          console.error('[CLERK WEBHOOK] No email address found in payload');
          return NextResponse.json(
            { error: 'No email address found' },
            { status: 400, headers: responseHeaders }
          );
        }

        // Extract user_id with validation
        const user_id = evt.data.id ?? '';
        if (!user_id) {
          console.error('[CLERK WEBHOOK] No user ID found in payload');
          return NextResponse.json(
            { error: 'No user ID found' },
            { status: 400, headers: responseHeaders }
          );
        }

        // Handle profile data with fallbacks for missing fields
        const first_name = evt.data.first_name || evt.data.username || '';
        const last_name = evt.data.last_name || '';
        const profile_image_url = evt.data.image_url || '';
        
        const userData = {
          email,
          first_name,
          last_name,
          profile_image_url,
          user_id,
        };
        
        try {
          console.log('[CLERK WEBHOOK] Updating user with data:', userData);
          const result = await userUpdate(userData);
          console.log('[CLERK WEBHOOK] User update result:', result);
          
          return NextResponse.json(
            { success: true, message: 'User updated successfully' },
            { status: 200, headers: responseHeaders }
          );
        } catch (error: unknown) {
          console.error('[CLERK WEBHOOK] Error in userUpdate:', error instanceof Error ? error.message : String(error));
          return NextResponse.json(
            { error: 'Failed to update user', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500, headers: responseHeaders }
          );
        }
      } else {
        // Respond to unhandled event types
        console.log(`[CLERK WEBHOOK] Unhandled event type: ${eventType}`);
        return NextResponse.json(
          { success: true, message: 'Event received but not processed' },
          { status: 200, headers: responseHeaders }
        );
      }
    } catch (verificationError: unknown) {
      console.error('[CLERK WEBHOOK] Verification failed', { 
        error: verificationError instanceof Error ? verificationError.message : String(verificationError)
      });
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400, headers: responseHeaders }
      );
    }
  } catch (error: unknown) {
    console.error('[CLERK WEBHOOK] Unexpected error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: responseHeaders }
    );
  }
}
