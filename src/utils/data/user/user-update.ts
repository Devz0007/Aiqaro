// src/utils/data/user/user-update.ts
'server only';

import { PostgrestError } from '@supabase/postgrest-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { userUpdateSchema, userUpdateProps } from '@/utils/types/user';
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
  const cookieStore = cookies();

  const supabase = createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_KEY,
    {
      cookies: {
        get(name: string) {
          const cookieValue = cookieStore.get(name)?.value;
          return cookieValue ?? undefined;
        },
      },
    }
  );

  try {
    // Validate input data against the schema
    userUpdateSchema.parse({
      email,
      first_name,
      last_name,
      profile_image_url,
      user_id,
    });

    const { data, error } = await supabase
      .from('user')
      .update({
        first_name,
        last_name,
        profile_image_url,
      })
      .eq('user_id', user_id)
      .select();

    if (error) {
      return [error];
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data;
  } catch (error: unknown) {
    console.error('Error updating user:', error);
    if (error instanceof z.ZodError) {
      throw new Error(`Validation Error: ${error.message}`);
    }
    if (error instanceof Error && 'message' in error) {
      throw new Error(error.message);
    }
    throw new Error('An unknown error occurred');
  }
};
