// src/utils/data/user/user-update.ts
import { prisma } from '@/utils/data/client/prima'; // <-- IMPORT the exported client

interface UserUpdateProps {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_image_url: string;
}

export const userUpdate = async ({
  user_id,
  email,
  first_name,
  last_name,
  profile_image_url,
}: UserUpdateProps): Promise<void> => {
  try {
    await prisma.user.update({
      where: {
        email, // Use email to find the user
      },
      data: {
        first_name,
        last_name,
        profile_image_url,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};
