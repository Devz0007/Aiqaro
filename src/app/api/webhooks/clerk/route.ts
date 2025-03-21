// src/app/api/webhooks/clerk/route.ts
import { WebhookEvent } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';

import { userCreate } from '@/utils/data/user/user-create';
import { userUpdate } from '@/utils/data/user/user-update';
import { env } from 'data/env/server';

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
      svix_id_present: !!svix_id,
      svix_timestamp_present: !!svix_timestamp,
      svix_signature_present: !!svix_signature 
    });

    if (
      !svix_id ||
      !svix_timestamp ||
      !svix_signature
    ) {
      console.error('[CLERK WEBHOOK] Missing svix headers');
      return NextResponse.json(
        { error: 'Missing svix headers' },
        { status: 400, headers: responseHeaders }
      );
    }
    
    // Get the body
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const rawPayload = await req.json();
    console.log('[CLERK WEBHOOK] Raw payload received', { 
      type: rawPayload?.type,
      data_id: rawPayload?.data?.id
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
        const userData = {
          email: evt.data.email_addresses?.[0]?.email_address ?? '',
          first_name: evt.data.first_name ?? '',
          last_name: evt.data.last_name ?? '',
          profile_image_url: evt.data.image_url ?? '',
          user_id: evt.data.id ?? '',
        };
        
        console.log('[CLERK WEBHOOK] Environment variables check:', { 
          supabase_url: env.SUPABASE_URL,
          supabase_key_present: !!env.SUPABASE_SERVICE_KEY
        });
        
        try {
          console.log('[CLERK WEBHOOK] Creating user with data:', userData);
          const result = await userCreate(userData);
          console.log('[CLERK WEBHOOK] User creation result:', result);
          
          return NextResponse.json(
            { success: true, message: 'User created successfully' },
            { status: 200, headers: responseHeaders }
          );
        } catch (error: unknown) {
          console.error('[CLERK WEBHOOK] Error in userCreate:', error instanceof Error ? error.message : error);
          return NextResponse.json(
            { error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500, headers: responseHeaders }
          );
        }
      } else if (eventType === 'user.updated') {
        // Handle user update similarly
        const userData = {
          email: evt.data.email_addresses?.[0]?.email_address ?? '',
          first_name: evt.data.first_name ?? '',
          last_name: evt.data.last_name ?? '',
          profile_image_url: evt.data.image_url ?? '',
          user_id: evt.data.id ?? '',
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
          console.error('[CLERK WEBHOOK] Error in userUpdate:', error instanceof Error ? error.message : error);
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
        error: verificationError instanceof Error ? verificationError.message : verificationError
      });
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400, headers: responseHeaders }
      );
    }
  } catch (error: unknown) {
    console.error('[CLERK WEBHOOK] Unexpected error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: responseHeaders }
    );
  }
}
