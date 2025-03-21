User Update

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
    }
  );

  try {
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
      return [error];
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(err.message); // Handle known error type
    }
    throw new Error('An unknown error occurred'); // Handle unknown error types
  }
};

