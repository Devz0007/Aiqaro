import { WebhookEvent } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';

export async function POST(req: Request): Promise<Response> {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id?.trim() || !svix_timestamp?.trim() || !svix_signature?.trim()) {
    return new Response('Error occurred -- no svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent | null = null;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id ?? '',
      'svix-timestamp': svix_timestamp ?? '',
      'svix-signature': svix_signature ?? '',
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', { status: 400 });
  }

  if (evt !== null) {
    const eventType = evt.type;

    if (eventType === 'user.created') {
      // Logging mechanism can be added here
    }
  }

  return new Response('', { status: 201 });
}