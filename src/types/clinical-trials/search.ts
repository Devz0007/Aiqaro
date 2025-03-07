// src/types/clinical-trials/search.ts
import { z } from 'zod';

import { Study, StudySchema } from './study';

/**
 * Search parameters interface for the ClinicalTrials.gov API
 *
 * This interface aligns with the official ClinicalTrials.gov API search areas:
 * - query.term: Basic search across 57 data fields (BasicSearch area)
 * - query.cond: Search across condition-related fields
 * - query.intr: Search across intervention-related fields
 * - query.titles: Search across title and acronym fields
 * - query.locn: Search across location-related fields
 */
export interface SearchParams {
  // Existing query parameters
  'query.term'?: string;
  'query.cond'?: string;
  'query.intr'?: string;
  'query.titles'?: string;
  'query.locn'?: string;
  'query.outc'?: string;
  'query.spons'?: string;
  'query.id'?: string;

  // Add filter parameters
  'filter.overallStatus'?: string[];
  'filter.phase'?: string[];
  'filter.geo'?: string;
  'filter.ids'?: string[];
  'filter.advanced'?: string;
  'filter.synonyms'?: string[];

  // Add post-filter parameters
  'postFilter.overallStatus'?: string[];
  'postFilter.geo'?: string;
  'postFilter.ids'?: string[];
  'postFilter.advanced'?: string;
  'postFilter.synonyms'?: string[];

  // Existing control parameters
  sort?: string[];
  format: 'json' | 'csv';
  pageSize: number;
  pageToken?: string;
  fields?: string[];
  countTotal: boolean;
}

/**
 * Zod schema for validating search parameters
 *
 * Enforces:
 * - Correct query parameter naming
 * - Valid format values
 * - Page size limits (1-1000)
 * - Required fields
 */
export const SearchParamsSchema = z
  .object({
    // Existing query parameters
    'query.term': z.string().optional(),
    'query.cond': z.string().optional(),
    'query.intr': z.string().optional(),
    'query.titles': z.string().optional(),
    'query.locn': z.string().optional(),
    'query.outc': z.string().optional(),
    'query.spons': z.string().optional(),
    'query.id': z.string().optional(),

    // Add filter parameters
    'filter.overallStatus': z.array(z.string()).optional(),
    'filter.phase': z.array(z.string()).optional(),
    'filter.geo': z.string().optional(),
    'filter.ids': z.array(z.string()).optional(),
    'filter.advanced': z.string().optional(),
    'filter.synonyms': z.array(z.string()).optional(),

    // Add post-filter parameters
    'postFilter.overallStatus': z.array(z.string()).optional(),
    'postFilter.geo': z.string().optional(),
    'postFilter.ids': z.array(z.string()).optional(),
    'postFilter.advanced': z.string().optional(),
    'postFilter.synonyms': z.array(z.string()).optional(),

    // Existing control parameters
    format: z.enum(['json', 'csv']),
    pageSize: z.number().int().min(1).max(1000),
    pageToken: z.string().optional(),
    fields: z.array(z.string()).optional(),
    countTotal: z.boolean(),
    sort: z.array(z.string()).optional(),
  })
  .strict();

/**
 * Type for API response containing study results
 */
export interface SearchResponse {
  studies: Study[];
  totalCount?: number;
  nextPageToken?: string;
}

/**
 * Zod schema for validating search response
 */
export const SearchResponseSchema = z.object({
  studies: z.array(StudySchema),
  totalCount: z.number().optional(),
  nextPageToken: z.string().optional(),
});
