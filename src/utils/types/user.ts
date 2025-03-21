import { z } from 'zod';

export type userCreateProps = z.infer<typeof userCreateSchema>;

export const userCreateSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }).describe('user email'),
  first_name: z
    .string()
    .regex(/^[a-zA-Z]*$/, { message: 'First name must only contain letters' })
    .optional()
    .describe('user first name'),
  last_name: z
    .string()
    .regex(/^[a-zA-Z]*$/, { message: 'Last name must only contain letters' })
    .optional()
    .describe('user last name'),
  profile_image_url: z
    .string()
    .url({ message: 'Invalid URL' })
    .optional()
    .describe('user profile image URL'),
  user_id: z.string().describe('user ID'),
});

export type userUpdateProps = z.infer<typeof userUpdateSchema>;

export const userUpdateSchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email' })
    .nonempty({ message: 'Email is required' })
    .describe('user email'),
  first_name: z
    .string()
    .regex(/^[a-zA-Z]*$/, { message: 'First name must only contain letters' })
    .optional()
    .describe('user first name'),
  last_name: z
    .string()
    .regex(/^[a-zA-Z]*$/, { message: 'Last name must only contain letters' })
    .optional()
    .describe('user last name'),
  profile_image_url: z
    .string()
    .url({ message: 'Invalid URL' })
    .optional()
    .describe('user profile image URL'),
  user_id: z.string().describe('user ID'),
});
