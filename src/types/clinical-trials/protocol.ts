// src/types/clinical-trials/protocol.ts
import { z } from 'zod';

import { StudyPhase } from './filters';
import {
  StudyIdentification,
  StudyIdentificationSchema,
} from './identification';
import { StudyStatus, StudyStatusSchema } from './status';

export type StudyType = 'EXPANDED_ACCESS' | 'INTERVENTIONAL' | 'OBSERVATIONAL';

export interface StudyDesign {
  allocation?: 'RANDOMIZED' | 'NON_RANDOMIZED' | 'NA';
  interventionModel?:
    | 'SINGLE_GROUP'
    | 'PARALLEL'
    | 'CROSSOVER'
    | 'FACTORIAL'
    | 'SEQUENTIAL';
  primaryPurpose?:
    | 'TREATMENT'
    | 'PREVENTION'
    | 'DIAGNOSTIC'
    | 'ECT'
    | 'SUPPORTIVE_CARE'
    | 'SCREENING'
    | 'HEALTH_SERVICES_RESEARCH'
    | 'BASIC_SCIENCE'
    | 'DEVICE_FEASIBILITY'
    | 'OTHER';
  masking?: 'NONE' | 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUADRUPLE';
}

interface Contact {
  name?: string;
  role?:
    | 'STUDY_CHAIR'
    | 'STUDY_DIRECTOR'
    | 'PRINCIPAL_INVESTIGATOR'
    | 'SUB_INVESTIGATOR'
    | 'CONTACT';
  phone?: string;
  phoneExt?: string;
  email?: string;
}

interface ContactsLocationsModule {
  locations?: Location[];
  centralContacts?: Contact[];
}

interface Location {
  city?: string;
  country?: string;
}

interface SponsorCollaboratorsModule {
  leadSponsor?: Sponsor;
}

interface Sponsor {
  name?: string;
}

interface DescriptionModule {
  briefSummary?: string;
  detailedDescription?: string;
}

interface ConditionModule {
  conditions?: string[];
  keywords?: string[];
}

const SexSchema = z.enum(['FEMALE', 'MALE', 'ALL']).optional();
const StdAgesSchema = z.enum(['CHILD', 'ADULT', 'OLDER_ADULT']).optional();
const SamplingMethodSchema = z
  .enum(['PROBABILITY_SAMPLE', 'NON_PROBABILITY_SAMPLE'])
  .optional();

const AgePattern =
  /^\d+ (Year|Years|Month|Months|Week|Weeks|Day|Days|Hour|Hours|Minute|Minutes)$/;

const EligibilityModuleSchema = z.object({
  eligibilityCriteria: z.string().optional(),
  healthyVolunteers: z.boolean().optional(),
  sex: SexSchema,
  genderBased: z.boolean().optional(),
  genderDescription: z.string().optional(),
  minimumAge: z
    .string()
    .regex(AgePattern, 'Invalid minimum age format')
    .optional(),
  maximumAge: z
    .string()
    .regex(AgePattern, 'Invalid maximum age format')
    .optional(),
  stdAges: z.array(StdAgesSchema).optional(),
  studyPopulation: z.string().optional(),
  samplingMethod: SamplingMethodSchema,
});

type EligibilityModule = z.infer<typeof EligibilityModuleSchema>;

export interface ProtocolSection {
  identificationModule: StudyIdentification;
  statusModule: StudyStatus;
  designModule: {
    studyType: StudyType;
    phases?: StudyPhase[];
    designInfo?: StudyDesign;
    enrollmentInfo?: {
      count: number;
      type: 'ACTUAL' | 'ESTIMATED';
    };
  };
  contactsLocationsModule?: ContactsLocationsModule;
  sponsorCollaboratorsModule?: SponsorCollaboratorsModule;
  descriptionModule?: DescriptionModule;
  conditionsModule?: ConditionModule;
  eligibilityModule?: EligibilityModule;
}

const LocationSchema = z.object({
  city: z.string().optional(),
  country: z.string().optional(),
});

const RoleSchema = z
  .enum([
    'STUDY_CHAIR',
    'STUDY_DIRECTOR',
    'PRINCIPAL_INVESTIGATOR',
    'SUB_INVESTIGATOR',
    'CONTACT',
  ])
  .optional();

const ContactSchema = z.object({
  name: z.string().optional(),
  role: RoleSchema,
  phone: z.string().optional(),
  phoneExt: z.string().optional(),
  email: z.string().optional(),
});

const CentralContactSchema = ContactSchema;

const ContactsLocationsModuleSchema = z.object({
  locations: z.array(LocationSchema).optional(),
  centralContacts: z.array(CentralContactSchema).optional(),
});

const SponsorSchema = z.object({
  name: z.string().optional(),
});

const SponsorCollaboratorsModuleSchema = z.object({
  leadSponsor: SponsorSchema.optional(),
});

const DescriptionModuleSchema = z.object({
  briefSummary: z.string().optional(),
  detailedDescription: z.string().optional(),
});

const ConditionModuleSchema = z.object({
  conditions: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
});

export const ProtocolSectionSchema: z.ZodType<ProtocolSection> = z.object({
  identificationModule: StudyIdentificationSchema,
  statusModule: StudyStatusSchema,
  designModule: z.object({
    studyType: z.enum(['EXPANDED_ACCESS', 'INTERVENTIONAL', 'OBSERVATIONAL']),
    phases: z.array(z.nativeEnum(StudyPhase)).optional(),
    designInfo: z
      .object({
        allocation: z.enum(['RANDOMIZED', 'NON_RANDOMIZED', 'NA']).optional(),
        interventionModel: z
          .enum([
            'SINGLE_GROUP',
            'PARALLEL',
            'CROSSOVER',
            'FACTORIAL',
            'SEQUENTIAL',
          ])
          .optional(),
        primaryPurpose: z
          .enum([
            'TREATMENT',
            'PREVENTION',
            'DIAGNOSTIC',
            'ECT',
            'SUPPORTIVE_CARE',
            'SCREENING',
            'HEALTH_SERVICES_RESEARCH',
            'BASIC_SCIENCE',
            'DEVICE_FEASIBILITY',
            'OTHER',
          ])
          .optional(),
        masking: z
          .enum(['NONE', 'SINGLE', 'DOUBLE', 'TRIPLE', 'QUADRUPLE'])
          .optional(),
      })
      .optional(),
    enrollmentInfo: z
      .object({
        count: z.number().int(),
        type: z.enum(['ACTUAL', 'ESTIMATED']),
      })
      .optional(),
  }),
  contactsLocationsModule: ContactsLocationsModuleSchema.optional(),
  sponsorCollaboratorsModule: SponsorCollaboratorsModuleSchema.optional(),
  descriptionModule: DescriptionModuleSchema.optional(),
  conditionsModule: ConditionModuleSchema.optional(),
  eligibilityModule: EligibilityModuleSchema.optional(),
});
