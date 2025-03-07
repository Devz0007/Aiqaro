'server only';

import { clerkClient } from '@clerk/nextjs/server';

import { prisma } from '@/utils/data/client/prima';

export const isAuthorized = async (
  userId: string
): Promise<{ authorized: boolean; message: string }> => {
  const result = (await clerkClient()).users.getUser(userId);

  if (!Boolean(result)) {
    return {
      authorized: false,
      message: 'User not found',
    };
  }

  try {
    const subscription = await prisma.subscriptions.findFirst({
      where: {
        user_id: userId,
      },
    });

    if (!subscription) {
      return {
        authorized: false,
        message: 'User is not subscribed',
      };
    }

    if (subscription.status === 'active') {
      return {
        authorized: true,
        message: 'User is subscribed',
      };
    }

    return {
      authorized: false,
      message: 'User is not subscribed',
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return {
        authorized: false,
        message: error.message,
      };
    }
    return {
      authorized: false,
      message: 'An unknown error occurred',
    };
  }
};
