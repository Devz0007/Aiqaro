// src/app/api/auth/webhook/route.ts
import { WebhookEvent } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';

import { userCreate } from '@/utils/data/user/user-create';
import { userUpdate } from '@/utils/data/user/user-update';
import { env } from 'data/env/server';

export async function POST(req: Request): Promise<Response> {
  console.log('[WEBHOOK] Received webhook request');
  const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('[WEBHOOK] Missing CLERK_WEBHOOK_SECRET');
    throw new Error(
      'Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local'
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');
  console.log('[WEBHOOK] Headers received:', { svix_id_present: !!svix_id });

  if (
    svix_id === null ||
    svix_id.length === 0 ||
    svix_timestamp === null ||
    svix_timestamp.length === 0 ||
    svix_signature === null ||
    svix_signature.length === 0
  ) {
    console.error('[WEBHOOK] Missing svix headers');
    return new Response('Error occurred -- missing svix headers', {
      status: 400,
    });
  }
  // Get the body
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const rawPayload = await req.json();
  const body = JSON.stringify(rawPayload);
  console.log('[WEBHOOK] Payload received');

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
    console.log('[WEBHOOK] Webhook verified successfully');
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('[WEBHOOK] Error verifying webhook:', err.message);
    } else {
      console.error('[WEBHOOK] Error verifying webhook:', err);
    }
    return new Response('Error occurred', { status: 400 });
  }

  const eventType = evt.type;
  console.log(`[WEBHOOK] Event type: ${eventType}`);

  switch (eventType) {
    case 'user.created':
      try {
        // Extract email with validation
        const email = evt.data.email_addresses?.[0]?.email_address ?? '';
        if (!email) {
          console.error('[WEBHOOK] No email address found in payload');
          return NextResponse.json({
            status: 400,
            message: 'No email address found',
          });
        }

        // Extract user_id with validation
        const user_id = evt.data.id ?? '';
        if (!user_id) {
          console.error('[WEBHOOK] No user ID found in payload');
          return NextResponse.json({
            status: 400,
            message: 'No user ID found',
          });
        }

        // Handle profile data with fallbacks
        const first_name = evt.data.first_name || evt.data.username || '';
        const last_name = evt.data.last_name || '';
        const profile_image_url = evt.data.image_url || '';

        console.log('[WEBHOOK] Creating user with data:', { 
          email, 
          first_name, 
          last_name, 
          profile_image_url: profile_image_url ? 'present' : 'not present', 
          user_id 
        });

        await userCreate({
          email,
          first_name,
          last_name,
          profile_image_url,
          user_id,
        });

        console.log('[WEBHOOK] User created successfully');
        return NextResponse.json({
          status: 200,
          message: 'User info inserted',
        });
      } catch (error: unknown) {
        console.error('[WEBHOOK] Error creating user:', error instanceof Error ? error.message : String(error));
        if (error instanceof Error) {
          return NextResponse.json({
            status: 400,
            message: error.message,
          });
        }
        return NextResponse.json({
          status: 400,
          message: 'An unknown error occurred',
        });
      }

    case 'user.updated':
      try {
        // Extract email with validation
        const email = evt.data.email_addresses?.[0]?.email_address ?? '';
        if (!email) {
          console.error('[WEBHOOK] No email address found in payload');
          return NextResponse.json({
            status: 400,
            message: 'No email address found',
          });
        }

        // Extract user_id with validation
        const user_id = evt.data.id ?? '';
        if (!user_id) {
          console.error('[WEBHOOK] No user ID found in payload');
          return NextResponse.json({
            status: 400,
            message: 'No user ID found',
          });
        }

        // Handle profile data with fallbacks
        const first_name = evt.data.first_name || evt.data.username || '';
        const last_name = evt.data.last_name || '';
        const profile_image_url = evt.data.image_url || '';

        console.log('[WEBHOOK] Updating user with data:', { 
          email, 
          first_name, 
          last_name, 
          profile_image_url: profile_image_url ? 'present' : 'not present', 
          user_id 
        });

        await userUpdate({
          email,
          first_name,
          last_name,
          profile_image_url,
          user_id,
        });

        console.log('[WEBHOOK] User updated successfully');
        return NextResponse.json({
          status: 200,
          message: 'User info updated',
        });
      } catch (error: unknown) {
        console.error('[WEBHOOK] Error updating user:', error instanceof Error ? error.message : String(error));
        if (error instanceof Error) {
          return NextResponse.json({
            status: 400,
            message: error.message,
          });
        }
        return NextResponse.json({
          status: 400,
          message: 'An unknown error occurred',
        });
      }

    default:
      console.log(`[WEBHOOK] Unhandled event type: ${eventType}`);
      return new Response('Error occurred -- unhandled event type', {
        status: 400,
      });
  }
}
