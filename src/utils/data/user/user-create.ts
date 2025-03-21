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
  console.log('[USER_CREATE] Starting user creation', { email, user_id });
  
  console.log('[USER_CREATE] Checking environment variables', {
    supabase_url_present: !!env.SUPABASE_URL,
    supabase_key_present: !!env.SUPABASE_SERVICE_KEY
  });
  
  const cookieStore = await cookies();
  console.log('[USER_CREATE] Got cookie store');

  try {
    console.log('[USER_CREATE] Creating Supabase client with URL:', env.SUPABASE_URL);
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
    console.log('[USER_CREATE] Supabase client created successfully');

    try {
      // Validate input data against the schema
      console.log('[USER_CREATE] Validating input data');
      userCreateSchema.parse({
        email,
        first_name,
        last_name,
        profile_image_url,
        user_id,
      });
      console.log('[USER_CREATE] Input data validation successful');

      console.log('[USER_CREATE] Inserting user into Supabase');
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
        console.error('[USER_CREATE] Error inserting user into Supabase', error);
        return [error];
      }

      console.log('[USER_CREATE] User created successfully', data);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return data;
    } catch (error: unknown) {
      console.error('[USER_CREATE] Error during user creation', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        zodError: error instanceof z.ZodError ? error.errors : undefined
      });
      if (error instanceof z.ZodError) {
        throw new Error(`Validation Error: ${error.message}`);
      }
      if (error instanceof Error && 'message' in error) {
        throw new Error(error.message);
      }
      throw new Error('An unknown error occurred');
    }
  } catch (clientError: unknown) {
    console.error('[USER_CREATE] Error creating Supabase client', {
      error: clientError instanceof Error ? clientError.message : clientError,
      stack: clientError instanceof Error ? clientError.stack : undefined
    });
    throw new Error('Failed to initialize Supabase client');
  }
};

