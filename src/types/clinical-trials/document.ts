// src/types/clinical-trials/document.ts
import { z } from 'zod';

/**
 * Document-related information for the study
 */
export interface DocumentSection {
  largeDocumentModule?: LargeDocumentModule;
}

interface LargeDocumentModule {
  noSap?: boolean;
  largeDocs: LargeDoc[];
}

interface LargeDoc {
  typeAbbrev: string;
  hasProtocol: boolean;
  hasSap: boolean;
  hasIcf: boolean;
  label?: string;
  date?: string;
  uploadDate: string;
  filename: string;
  size: number;
}

export const DocumentSectionSchema = z
  .object({
    largeDocumentModule: z
      .object({
        noSap: z.boolean().optional(),
        largeDocs: z.array(
          z.object({
            typeAbbrev: z.string(),
            hasProtocol: z.boolean(),
            hasSap: z.boolean(),
            hasIcf: z.boolean(),
            label: z.string().optional(),
            date: z.string().optional(),
            uploadDate: z.string(),
            filename: z.string(),
            size: z.number(),
          })
        ),
      })
      .optional(),
  })
  .strict();
