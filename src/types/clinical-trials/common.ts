// src/types/clinical-trials/common.ts
import { z } from 'zod';

/**
 * Common date structure used throughout the application
 * @see https://clinicaltrials.gov/api/v2/docs
 */
export interface DateStruct {
  date: string;
  type?: 'ACTUAL' | 'ESTIMATED';
}

export const DateStructSchema: z.ZodType<DateStruct> = z.object({
  date: z.string(),
  type: z
    .enum(['ACTUAL', 'ESTIMATED'], {
      errorMap: (): { message: string } => ({
        message: "Date type must be either 'ACTUAL' or 'ESTIMATED'",
      }),
    })
    .optional(),
});

/**
 * Organization information structure
 */
export interface Organization {
  fullName: string;
  class:
    | 'NIH'
    | 'FED'
    | 'OTHER_GOV'
    | 'INDIV'
    | 'INDUSTRY'
    | 'NETWORK'
    | 'OTHER'
    | 'UNKNOWN';
}

export const OrganizationSchema: z.ZodType<Organization> = z.object({
  fullName: z.string().min(1, 'Organization name cannot be empty'),
  class: z.enum(
    [
      'NIH',
      'FED',
      'OTHER_GOV',
      'INDIV',
      'INDUSTRY',
      'NETWORK',
      'OTHER',
      'UNKNOWN',
    ],
    {
      errorMap: (): { message: string } => ({
        message: 'Invalid organization class',
      }),
    }
  ),
});

// Helper functions for common patterns
export const createDateSchema = (): z.ZodType<string | undefined> =>
  z
    .string()
    .optional()
    .transform(
      (val: string | undefined): string | undefined => val ?? undefined
    );

/**
 * Creates a required enum schema
 */
export const createRequiredEnum = <T extends [string, ...string[]]>(
  values: readonly [...T],
  errorMessage?: string
): z.ZodEnum<[...T]> =>
  z.enum(values as [...T], {
    errorMap: (): { message: string } => ({
      message: errorMessage ?? 'Invalid enum value',
    }),
  });

/**
 * Creates an optional enum schema
 */
export const createOptionalEnum = <T extends [string, ...string[]]>(
  values: readonly [...T]
): z.ZodOptional<z.ZodEnum<[...T]>> => createRequiredEnum(values).optional();

/**
 * Custom refinement for date validation
 */
export const dateRefinement = z.string().refine(
  (val: string): boolean => {
    if (val === '') {
      return true;
    }
    return /^\d{4}-\d{2}-\d{2}$/.test(val);
  },
  { message: 'Invalid date format. Expected YYYY-MM-DD' }
);

/**
 * Creates a nested schema structure for measurements and categories
 * This utility function creates a Zod schema for nested measurement data
 * with optional titles and categories
 *
 * @param schema The Zod schema for measurements
 * @returns A Zod schema for the nested structure
 */
export const createNestedSchema = <TSchema extends z.ZodTypeAny>(
  schema: TSchema
): z.ZodOptional<
  z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    categories: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<{
          title: z.ZodOptional<z.ZodString>;
          measurements: z.ZodOptional<z.ZodArray<TSchema>>;
        }>
      >
    >;
  }>
> => {
  return z
    .object({
      title: z.string().optional(),
      categories: z
        .array(
          z.object({
            title: z.string().optional(),
            measurements: z.array(schema).optional(),
          })
        )
        .optional(),
    })
    .optional();
};
