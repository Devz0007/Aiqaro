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
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

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

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    const headerValues: Record<string, string> = {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    };
    
    evt = wh.verify(body, headerValues) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred during verification', {
      status: 400,
    });
  }

  // Get the type
  const eventType = evt.type;

  if (eventType === 'user.created') {
    // Handle user creation event
    // Example: await createUser(evt.data);
  }

  return new Response('', { status: 201 });
}