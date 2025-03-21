// src/utils/data/user/user-create.ts
import { prisma } from '@/utils/data/client/prima'; // <-- IMPORT the exported client

interface UserCreateProps {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_image_url: string;
}

export const userCreate = async ({
  user_id,
  email,
  first_name,
  last_name,
  profile_image_url,
}: UserCreateProps): Promise<void> => {
  try {
    await prisma.user.create({
      data: {
        email,
        first_name,
        last_name,
        profile_image_url,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};
