import { supabase } from '@/lib/supabase/client';

interface CreateUserParams {
  id: string;
  email: string;
  name: string;
}

export async function createUser({ id, email, name }: CreateUserParams): Promise<void> {
  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingUser) {
      // User doesn't exist, create them
      const { error } = await supabase
        .from('users')
        .insert([
          {
            id,
            email,
            name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
} 