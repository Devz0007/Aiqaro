// src/app/api/webhooks/clerk/route.ts
import { WebhookEvent } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';

import { userCreate } from '@/utils/data/user/user-create';
import { userUpdate } from '@/utils/data/user/user-update';
import { env } from 'data/env/server';

export async function POST(req: Request): Promise<Response> {
  const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      'Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local'
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (
    svix_id === null ||
    svix_id.length === 0 ||
    svix_timestamp === null ||
    svix_timestamp.length === 0 ||
    svix_signature === null ||
    svix_signature.length === 0
  ) {
    return new Response('Error occurred -- missing svix headers', {
      status: 400,
    });
  }
  // Get the body
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const rawPayload = await req.json();
  const body = JSON.stringify(rawPayload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Error verifying webhook:', err.message);
    } else {
      console.error('Error verifying webhook:', err);
    }
    return new Response('Error occurred', { status: 400 });
  }

  const eventType = evt.type;

  switch (eventType) {
    case 'user.created':
      try {
        await userCreate({
          email: evt.data.email_addresses?.[0]?.email_address ?? '',
          first_name: evt.data.first_name ?? '',
          last_name: evt.data.last_name ?? '',
          profile_image_url: evt.data.image_url ?? '',
          user_id: evt.data.id ?? '',
        });

        return NextResponse.json({
          status: 200,
          message: 'User info inserted',
        });
      } catch (error: unknown) {
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
        await userUpdate({
          email: evt.data.email_addresses?.[0]?.email_address ?? '',
          first_name: evt.data.first_name ?? '',
          last_name: evt.data.last_name ?? '',
          profile_image_url: evt.data.image_url ?? '',
          user_id: evt.data.id ?? '',
        });

        return NextResponse.json({
          status: 200,
          message: 'User info updated',
        });
      } catch (error: unknown) {
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
      return new Response('Error occurred -- unhandled event type', {
        status: 400,
      });
  }
}
