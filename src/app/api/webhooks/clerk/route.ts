import { WebhookEvent } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';

export async function POST(req: Request): Promise<Response> {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (WEBHOOK_SECRET === undefined || WEBHOOK_SECRET === '') {
    throw new Error(
      'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local',
    );
  }

  // Get the headers
  const headerPayload = headers();
  
  // Explicitly type these as string | null to satisfy TypeScript
  const svix_id: string | null = headerPayload.get('svix-id');
  const svix_timestamp: string | null = headerPayload.get('svix-timestamp');
  const svix_signature: string | null = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (svix_id === null || svix_id === '') {
    return new Response('Error occurred -- missing svix-id header', {
      status: 400,
    });
  }
  
  if (svix_timestamp === null || svix_timestamp === '') {
    return new Response('Error occurred -- missing svix-timestamp header', {
      status: 400,
    });
  }
  
  if (svix_signature === null || svix_signature === '') {
    return new Response('Error occurred -- missing svix-signature header', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  // Define event with proper typing
  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred during verification', {
      status: 400,
    });
  }

  // Get the event type
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const eventType = evt.type;

  if (eventType === 'user.created') {
    // Handle user creation
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userData = evt.data;
    // Process userData...
  }

  return new Response('', { status: 201 });
}