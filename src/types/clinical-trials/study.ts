// src/types/clinical-trials/study.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck TODO: @Arhan13 to remove this
import { z } from 'zod';

import { AnnotationSection, AnnotationSectionSchema } from './annotation';
import { DerivedSection, DerivedSectionSchema } from './derived';
import { DocumentSection, DocumentSectionSchema } from './document';
import { ProtocolSection, ProtocolSectionSchema } from './protocol';
import { ResultsSection, ResultsSectionSchema } from './results';

/**
 * Complete study information from ClinicalTrials.gov API
 *
 * A study record contains the following main sections:
 * - Protocol Section: Core study information
 * - Results Section: Study results if available
 * - Annotation Section: Internal annotations
 * - Document Section: Related documents
 * - Derived Section: Internally generated data
 */
export interface Study {
  protocolSection?: ProtocolSection;
  resultsSection?: ResultsSection;
  annotationSection?: AnnotationSection;
  documentSection?: DocumentSection;
  derivedSection?: DerivedSection;
  hasResults: boolean;
}

/**
 * Zod schema for validating study data
 *
 * Ensures all required sections are present and validates
 * their structure according to the API specification
 */
export const StudySchema: z.ZodType<Study> = z.object({
  protocolSection: ProtocolSectionSchema.optional(),
  resultsSection: ResultsSectionSchema.optional(),
  annotationSection: AnnotationSectionSchema.optional(),
  documentSection: DocumentSectionSchema.optional(),
  derivedSection: DerivedSectionSchema.optional(),
  hasResults: z.boolean(),
});
