// src/types/clinical-trials/annotation.ts
import { z } from 'zod';

export enum UnpostedEventType {
  RESET = 'RESET',
  RELEASE = 'RELEASE',
  UNRELEASE = 'UNRELEASE',
}

export enum ViolationEventType {
  VIOLATION_IDENTIFIED = 'VIOLATION_IDENTIFIED',
  CORRECTION_CONFIRMED = 'CORRECTION_CONFIRMED',
  PENALTY_IMPOSED = 'PENALTY_IMPOSED',
  ISSUES_IN_LETTER_ADDRESSED_CONFIRMED = 'ISSUES_IN_LETTER_ADDRESSED_CONFIRMED',
}

export interface AnnotationSection {
  annotationModule?: AnnotationModule;
}

interface AnnotationModule {
  unpostedAnnotation?: UnpostedAnnotation;
  violationAnnotation?: ViolationAnnotation;
}

interface UnpostedAnnotation {
  unpostedResponsibleParty?: string;
  unpostedEvents: UnpostedEvent[];
}

interface UnpostedEvent {
  type: UnpostedEventType;
  date: string;
  dateUnknown?: boolean;
}

interface ViolationAnnotation {
  violationEvents: ViolationEvent[];
}

interface ViolationEvent {
  type: ViolationEventType;
  description: string;
  creationDate: string;
  issuedDate?: string;
  releaseDate?: string;
  postedDate?: string;
}

export const AnnotationSectionSchema = z
  .object({
    annotationModule: z
      .object({
        unpostedAnnotation: z
          .object({
            unpostedResponsibleParty: z.string().optional(),
            unpostedEvents: z.array(
              z.object({
                type: z.nativeEnum(UnpostedEventType),
                date: z.string(),
                dateUnknown: z.boolean().optional(),
              })
            ),
          })
          .optional(),
        violationAnnotation: z
          .object({
            violationEvents: z.array(
              z.object({
                type: z.nativeEnum(ViolationEventType),
                description: z.string(),
                creationDate: z.string(),
                issuedDate: z.string().optional(),
                releaseDate: z.string().optional(),
                postedDate: z.string().optional(),
              })
            ),
          })
          .optional(),
      })
      .optional(),
  })
  .strict();
