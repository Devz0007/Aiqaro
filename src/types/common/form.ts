// src/types/common/form.ts

import { z } from 'zod';

import {
  Sex,
  SortDirection,
  SortField,
  StudyPhase,
  StudyStatus,
} from '../clinical-trials/filters';

export const SearchFormSchema = z
  .object({
    searchTerm: z.string().optional(),
    phase: z.array(z.nativeEnum(StudyPhase)).optional(), // Allow multiple phases
    status: z.array(z.nativeEnum(StudyStatus)).optional(), // Allow multiple statuses
    location: z.string().optional(),
    therapeuticArea: z.array(z.string()).optional(), // Allow multiple therapeutic areas
    sortField: z.nativeEnum(SortField),
    sortDirection: z.nativeEnum(SortDirection),
    intervention: z.string().optional(),
    title: z.string().optional(),
    outcome: z.string().optional(),
    sponsor: z.string().optional(),
    studyId: z.string().optional(),
    gender: z.nativeEnum(Sex),
    healthyVolunteers: z.boolean(),
    showBookmarksOnly: z.boolean().optional().default(false),
    minAge: z
      .string()
      .optional()
      .refine(
        (val): boolean => {
          if (val === undefined || val === '') {
            return true;
          }
          return !isNaN(Number(val));
        },
        {
          message: 'Min age must be a number',
        }
      ),
    maxAge: z
      .string()
      .optional()
      .refine(
        (val): boolean => {
          if (val === undefined || val === '') {
            return true;
          }
          return !isNaN(Number(val));
        },
        {
          message: 'Max age must be a number',
        }
      ),
  })
  .refine(
    (data): boolean => {
      const hasMinAge = data.minAge !== undefined && data.minAge !== '';
      const hasMaxAge = data.maxAge !== undefined && data.maxAge !== '';

      if (hasMinAge && hasMaxAge) {
        return Number(data.maxAge) >= Number(data.minAge);
      }
      return true;
    },
    {
      message: 'Max age must be greater than or equal to min age',
      path: ['maxAge'],
    }
  );

export type SearchForm = z.infer<typeof SearchFormSchema>;
