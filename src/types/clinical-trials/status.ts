// src/types/clinical-trials/status.ts
import { z } from 'zod';

import { DateStruct, DateStructSchema } from './common';

/**
 * Study status information
 */
export interface StudyStatus {
  lastUpdatePostDateStruct?: DateStruct;
  statusVerifiedDate: string;
  overallStatus: StudyOverallStatus;
  lastKnownStatus?: string;
  whyStopped?: string;
  startDateStruct?: DateStruct;
  primaryCompletionDateStruct?: DateStruct;
  completionDateStruct?: DateStruct;
}

export type StudyOverallStatus =
  | 'ACTIVE_NOT_RECRUITING'
  | 'COMPLETED'
  | 'ENROLLING_BY_INVITATION'
  | 'NOT_YET_RECRUITING'
  | 'RECRUITING'
  | 'SUSPENDED'
  | 'TERMINATED'
  | 'WITHDRAWN'
  | 'AVAILABLE'
  | 'NO_LONGER_AVAILABLE'
  | 'TEMPORARILY_NOT_AVAILABLE'
  | 'APPROVED_FOR_MARKETING'
  | 'WITHHELD'
  | 'UNKNOWN';

export const StudyStatusSchema: z.ZodType<StudyStatus> = z.object({
  statusVerifiedDate: z.string(),
  lastUpdatePostDateStruct: DateStructSchema.optional(),
  overallStatus: z.enum([
    'ACTIVE_NOT_RECRUITING',
    'COMPLETED',
    'ENROLLING_BY_INVITATION',
    'NOT_YET_RECRUITING',
    'RECRUITING',
    'SUSPENDED',
    'TERMINATED',
    'WITHDRAWN',
    'AVAILABLE',
    'NO_LONGER_AVAILABLE',
    'TEMPORARILY_NOT_AVAILABLE',
    'APPROVED_FOR_MARKETING',
    'WITHHELD',
    'UNKNOWN',
  ]),
  lastKnownStatus: z.string().optional(),
  whyStopped: z.string().optional(),
  startDateStruct: DateStructSchema.optional(),
  primaryCompletionDateStruct: DateStructSchema.optional(),
  completionDateStruct: DateStructSchema.optional(),
});
