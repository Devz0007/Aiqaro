//src/types/clinical-trials/derived.ts
import { z } from 'zod';

/**
 * Internally generated data for the study
 */
export interface DerivedSection {
  miscInfoModule?: MiscInfoModule;
  conditionBrowseModule?: BrowseModule;
  interventionBrowseModule?: BrowseModule;
}

interface MiscInfoModule {
  versionHolder?: string;
  removedCountries?: string[];
  submissionTracking?: SubmissionTracking;
}

interface SubmissionTracking {
  estimatedResultsFirstSubmitDate?: string;
  firstMcpInfo?: FirstMcpInfo;
  submissionInfos?: SubmissionInfo[];
}

interface FirstMcpInfo {
  postDateStruct?: DateStruct;
}

interface DateStruct {
  date: string;
  type?: string;
}

interface SubmissionInfo {
  releaseDate?: string;
  unreleaseDate?: string;
  unreleaseDateUnknown?: boolean;
  resetDate?: string;
  mcpReleaseN?: number;
}

interface BrowseModule {
  meshes?: Mesh[];
  ancestors?: Mesh[];
  browseLeaves?: BrowseLeaf[];
  browseBranches?: BrowseBranch[];
}

interface Mesh {
  id: string;
  term: string;
}

interface BrowseLeaf {
  id: string;
  name: string;
  asFound?: string;
  relevance: 'LOW' | 'HIGH';
}

interface BrowseBranch {
  abbrev: string;
  name: string;
}

export const DerivedSectionSchema = z
  .object({
    miscInfoModule: z
      .object({
        versionHolder: z.string().optional(),
        removedCountries: z.array(z.string()).optional(),
        submissionTracking: z
          .object({
            estimatedResultsFirstSubmitDate: z.string().optional(),
            firstMcpInfo: z
              .object({
                postDateStruct: z
                  .object({
                    date: z.string(),
                    type: z.string().optional(),
                  })
                  .optional(),
              })
              .optional(),
            submissionInfos: z
              .array(
                z.object({
                  releaseDate: z.string().optional(),
                  unreleaseDate: z.string().optional(),
                  unreleaseDateUnknown: z.boolean().optional(),
                  resetDate: z.string().optional(),
                  mcpReleaseN: z.number().optional(),
                })
              )
              .optional(),
          })
          .optional(),
      })
      .optional(),
    conditionBrowseModule: z
      .object({
        meshes: z
          .array(
            z.object({
              id: z.string(),
              term: z.string(),
            })
          )
          .optional(),
        ancestors: z
          .array(
            z.object({
              id: z.string(),
              term: z.string(),
            })
          )
          .optional(),
        browseLeaves: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              asFound: z.string().optional(),
              relevance: z.enum(['LOW', 'HIGH']),
            })
          )
          .optional(),
        browseBranches: z
          .array(
            z.object({
              abbrev: z.string(),
              name: z.string(),
            })
          )
          .optional(),
      })
      .optional(),
    interventionBrowseModule: z
      .object({
        meshes: z
          .array(
            z.object({
              id: z.string(),
              term: z.string(),
            })
          )
          .optional(),
        ancestors: z
          .array(
            z.object({
              id: z.string(),
              term: z.string(),
            })
          )
          .optional(),
        browseLeaves: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              asFound: z.string().optional(),
              relevance: z.enum(['LOW', 'HIGH']),
            })
          )
          .optional(),
        browseBranches: z
          .array(
            z.object({
              abbrev: z.string(),
              name: z.string(),
            })
          )
          .optional(),
      })
      .optional(),
  })
  .strict();
