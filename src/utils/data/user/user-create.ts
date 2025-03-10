// src/utils/data/user/user-create.ts
'server only';

import { PostgrestError } from '@supabase/postgrest-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { userCreateSchema, userUpdateProps } from '@/utils/types/user';
import { env } from 'data/env/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UserCreateResponse = PostgrestError[] | any[];

export const userCreate = async ({
  email,
  first_name,
  last_name,
  profile_image_url,
  user_id,
}: userUpdateProps): Promise<UserCreateResponse> => {
  const cookieStore = await cookies();

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
    userCreateSchema.parse({
      email,
      first_name,
      last_name,
      profile_image_url,
      user_id,
    });

    const { data, error } = await supabase
      .from('user')
      .insert([
        {
          email,
          first_name,
          last_name,
          profile_image_url,
          user_id,
        },
      ])
      .select();

    if (error) {
      return [error];
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data;
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    if (error instanceof z.ZodError) {
      throw new Error(`Validation Error: ${error.message}`);
    }
    if (error instanceof Error && 'message' in error) {
      throw new Error(error.message);
    }
    throw new Error('An unknown error occurred');
  }
};
