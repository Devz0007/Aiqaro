// src/utils/data/user/user-update.ts
'server only';

import { PostgrestError } from '@supabase/postgrest-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { userUpdateProps } from '@/utils/types/user';
import { env } from 'data/env/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UserUpdateResponse = PostgrestError[] | any[];

export const userUpdate = async ({
  email,
  first_name,
  last_name,
  profile_image_url,
  user_id,
}: userUpdateProps): Promise<UserUpdateResponse> => {
  const cookieStore = await cookies();
  
  console.log('[USER_UPDATE] Starting user update', { email, user_id });
  console.log('[USER_UPDATE] Checking environment variables', {
    supabase_url_present: env.SUPABASE_URL !== undefined && env.SUPABASE_URL !== '',
    supabase_key_present: env.SUPABASE_SERVICE_KEY !== undefined && env.SUPABASE_SERVICE_KEY !== ''
  });

  const supabase = createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_KEY,
    {
      cookies: {
        get(name: string) {
          const cookieValue = cookieStore.get(name)?.value;
          return cookieValue ?? undefined; // Handle undefined explicitly
        },
      },
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: false, // Important for serverless environments
      },
      global: {
        headers: {
          'x-application-name': 'aiqaro',
        },
      },
    }
  );
  
  console.log('[USER_UPDATE] Supabase client created successfully');

  try {
    console.log('[USER_UPDATE] Updating user in Supabase', { email, user_id });
    const { data, error } = await supabase
      .from('user')
      .update([
        {
          email,
          first_name,
          last_name,
          profile_image_url,
          user_id,
        },
      ])
      .eq('email', email)
      .select();

    if (error) {
      console.error('[USER_UPDATE] Error updating user in Supabase', error);
      return [error];
    }

    console.log('[USER_UPDATE] User updated successfully', data);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data;
  } catch (err: unknown) {
    console.error('[USER_UPDATE] Error during user update', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    });
    if (err instanceof Error) {
      throw new Error(err.message); // Handle known error type
    }
    throw new Error('An unknown error occurred'); // Handle unknown error types
  }
};

