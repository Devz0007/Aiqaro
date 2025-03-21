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
  const userIdAsInt = parseInt(user_id, 10); // Convert to integer

  if (isNaN(userIdAsInt)) {
    throw new Error(`Invalid user_id: ${user_id}. Cannot convert to integer.`);
  }

  try {
    await prisma.user.update({
      where: {
        id: userIdAsInt, // Use the converted integer
      },
      data: {
        email,
        first_name, // Corrected to snake_case
        last_name, // Corrected to snake_case
        profile_image_url, // Corrected to snake_case
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};
