// src/types/clinical-trials/filters.ts
import { z } from 'zod';

// 1. Update StudyPhase to match API exactly
export enum StudyPhase {
  PHASE1 = 'PHASE1',
  PHASE2 = 'PHASE2',
  PHASE3 = 'PHASE3',
  PHASE4 = 'PHASE4',
  EARLY_PHASE1 = 'EARLY_PHASE1',
  NA = 'NA',
}

// 2. Update StudyStatus to include all possible values
export enum StudyStatus {
  NOT_YET_RECRUITING = 'NOT_YET_RECRUITING',
  RECRUITING = 'RECRUITING',
  ENROLLING_BY_INVITATION = 'ENROLLING_BY_INVITATION',
  ACTIVE_NOT_RECRUITING = 'ACTIVE_NOT_RECRUITING',
  COMPLETED = 'COMPLETED',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  WITHDRAWN = 'WITHDRAWN',
  AVAILABLE = 'AVAILABLE',
  NO_LONGER_AVAILABLE = 'NO_LONGER_AVAILABLE',
  TEMPORARILY_NOT_AVAILABLE = 'TEMPORARILY_NOT_AVAILABLE',
  APPROVED_FOR_MARKETING = 'APPROVED_FOR_MARKETING',
  WITHHELD = 'WITHHELD',
  UNKNOWN = 'UNKNOWN',
}

// 3. Add Sex enum instead of string literals
export enum Sex {
  ALL = 'ALL',
  FEMALE = 'FEMALE',
  MALE = 'MALE',
}

// 4. Update sort fields to match API capabilities
export enum SortField {
  LAST_UPDATE_POST_DATE = 'LastUpdatePostDate',
  ENROLLMENT_COUNT = 'EnrollmentCount',
  STUDY_FIRST_POST_DATE = 'StudyFirstPostDate',
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

// 5. Update SearchFilters interface with more precise types
export interface SearchFilters {
  phase?: StudyPhase[];
  status?: StudyStatus[];
  location?: string;
  minAge?: string;
  maxAge?: string;
  gender?: Sex;
  healthyVolunteers?: boolean;
  sort?: {
    field: SortField;
    direction: SortDirection;
  };
  therapeuticArea?: string[];
}

// 6. Update schema with more precise validations
export const SearchFiltersSchema = z
  .object({
    phase: z.array(z.nativeEnum(StudyPhase)).optional(),
    status: z.array(z.nativeEnum(StudyStatus)).optional(),
    location: z.string().min(1).optional(),
    minAge: z.string().regex(/^\d+$/, 'Age must be a number').optional(),
    maxAge: z.string().regex(/^\d+$/, 'Age must be a number').optional(),
    gender: z.nativeEnum(Sex).optional(),
    healthyVolunteers: z.boolean().optional(),
    sort: z
      .object({
        field: z.nativeEnum(SortField),
        direction: z.nativeEnum(SortDirection),
      })
      .optional(),
    therapeuticArea: z.array(z.string()).optional(), // Updated to allow multiple values
  })
  .refine(
    (data) => {
      const minAge = data.minAge ?? '';
      const maxAge = data.maxAge ?? '';

      if (minAge !== '' && maxAge !== '') {
        return parseInt(minAge, 10) <= parseInt(maxAge, 10);
      }

      return true;
    },
    {
      message: 'Minimum age must be less than or equal to maximum age',
    }
  );

// 7. Update display maps with more precise types
export const phaseDisplayMap: Readonly<Record<StudyPhase, string>> = {
  [StudyPhase.PHASE1]: 'Phase 1',
  [StudyPhase.PHASE2]: 'Phase 2',
  [StudyPhase.PHASE3]: 'Phase 3',
  [StudyPhase.PHASE4]: 'Phase 4',
  [StudyPhase.EARLY_PHASE1]: 'Early Phase 1',
  [StudyPhase.NA]: 'Not Applicable',
};

export const statusDisplayMap: Readonly<Record<StudyStatus, string>> = {
  [StudyStatus.NOT_YET_RECRUITING]: 'Not yet recruiting',
  [StudyStatus.RECRUITING]: 'Recruiting',
  [StudyStatus.ENROLLING_BY_INVITATION]: 'Enrolling by invitation',
  [StudyStatus.ACTIVE_NOT_RECRUITING]: 'Active, not recruiting',
  [StudyStatus.COMPLETED]: 'Completed',
  [StudyStatus.SUSPENDED]: 'Suspended',
  [StudyStatus.TERMINATED]: 'Terminated',
  [StudyStatus.WITHDRAWN]: 'Withdrawn',
  [StudyStatus.AVAILABLE]: 'Available',
  [StudyStatus.NO_LONGER_AVAILABLE]: 'No longer available',
  [StudyStatus.TEMPORARILY_NOT_AVAILABLE]: 'Temporarily not available',
  [StudyStatus.APPROVED_FOR_MARKETING]: 'Approved for marketing',
  [StudyStatus.WITHHELD]: 'Withheld',
  [StudyStatus.UNKNOWN]: 'Unknown',
};

// 8. Update therapeutic areas with more type safety
export const THERAPEUTIC_AREAS = [
  { value: 'oncology', label: 'Oncology' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'immunology', label: 'Immunology' },
  { value: 'infectious_diseases', label: 'Infectious Diseases' },
  { value: 'rare_diseases', label: 'Rare Diseases' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'metabolic', label: 'Metabolic Disorders' },
];

export type TherapeuticArea = (typeof THERAPEUTIC_AREAS)[number]['value'];
