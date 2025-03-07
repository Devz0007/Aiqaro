// src/types/clinical-trials/identification.ts
import { z } from 'zod';

import { Organization, OrganizationSchema } from './common';

/**
 * Study identification information
 * @see https://clinicaltrials.gov/api/v2/docs
 */
export interface StudyIdentification {
  nctId: string;
  orgStudyIdInfo: {
    id: string;
    type?: string;
    link?: string;
  };
  secondaryIdInfos?: Array<{
    id: string;
    type?: string;
    domain?: string;
    link?: string;
  }>;
  organization: Organization;
  briefTitle: string;
  officialTitle?: string;
  acronym?: string;
}

export const StudyIdentificationSchema: z.ZodType<StudyIdentification> =
  z.object({
    nctId: z.string().regex(/^NCT\d{8}$/, 'Invalid NCT ID format'),
    orgStudyIdInfo: z.object({
      id: z.string().min(1, 'Organization study ID cannot be empty'),
      type: z.string().optional(),
      link: z.string().url().optional(),
    }),
    secondaryIdInfos: z
      .array(
        z.object({
          id: z.string(),
          type: z.string().optional(),
          domain: z.string().optional(),
          link: z.string().url().optional(),
        })
      )
      .optional(),
    organization: OrganizationSchema,
    briefTitle: z.string().min(1, 'Brief title cannot be empty'),
    officialTitle: z.string().optional(),
    acronym: z.string().optional(),
  });
