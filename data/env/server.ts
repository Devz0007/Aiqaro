import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  emptyStringAsUndefined: true,
  server: {
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url(),
    CLERK_SECRET_KEY: z.string(),
    CLERK_WEBHOOK_SECRET: z.string(),
    STRIPE_SECRET_KEY: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),
    STRIPE_BASIC_PLAN_STRIPE_PRICE_ID: z.string(),
    STRIPE_STANDARD_PLAN_STRIPE_PRICE_ID: z.string().optional(), //TODO: @Arhan13: Make this required
    STRIPE_PREMIUM_PLAN_STRIPE_PRICE_ID: z.string().optional(), //TODO: @Arhan13: Make this required
    TEST_COUNTRY_CODE: z.string(),
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_KEY: z.string(),
    FRONTEND_URL: z.string().url(),
  },
  experimental__runtimeEnv: process.env,
});
