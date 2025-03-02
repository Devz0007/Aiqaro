//src/types/clinical-trials/results.ts

import { z } from 'zod';

/**
 * Study results section containing outcome data and analysis
 */
export interface ResultsSection {
  participantFlowModule?: ParticipantFlowModule;
  baselineCharacteristicsModule?: BaselineCharacteristicsModule;
  outcomeMeasuresModule?: OutcomeMeasuresModule;
  adverseEventsModule?: AdverseEventsModule;
  moreInfoModule?: MoreInfoModule;
}

export interface ParticipantFlowModule {
  preAssignmentDetails?: string;
  recruitmentDetails?: string;
  typeUnitsAnalyzed?: string;
  groups: FlowGroup[];
  periods: FlowPeriod[];
}

export interface FlowGroup {
  id: string;
  title: string;
  description?: string;
}

export interface FlowPeriod {
  title: string;
  milestones: FlowMilestone[];
  dropWithdraws?: DropWithdraw[];
}

export interface FlowMilestone {
  type: string;
  comment?: string;
  achievements: FlowStats[];
}

export interface FlowStats {
  groupId: string;
  numSubjects?: string;
  numUnits?: string;
  comment?: string;
}

export interface DropWithdraw {
  type: string;
  comment?: string;
  reasons: FlowStats[];
}

export interface BaselineCharacteristicsModule {
  populationDescription?: string;
  typeUnitsAnalyzed?: string;
  groups: MeasureGroup[];
  denoms: Denom[];
  measures: BaselineMeasure[];
}

export interface MeasureGroup {
  id: string;
  title: string;
  description?: string;
}

export interface Denom {
  units: string;
  counts: DenomCount[];
}

export interface DenomCount {
  groupId: string;
  value: string;
}

export interface BaselineMeasure {
  title: string;
  description?: string;
  populationDescription?: string;
  paramType: string;
  dispersionType?: string;
  unitOfMeasure?: string;
  classes: MeasureClass[];
}

export interface MeasureClass {
  title?: string;
  categories: MeasureCategory[];
}

export interface MeasureCategory {
  title?: string;
  measurements: Measurement[];
}

export interface Measurement {
  groupId: string;
  value?: string;
  spread?: string;
  lowerLimit?: string;
  upperLimit?: string;
  comment?: string;
}

export interface OutcomeMeasuresModule {
  outcomeMeasures: OutcomeMeasure[];
}

export interface OutcomeMeasure {
  type: OutcomeMeasureType;
  title: string;
  description?: string;
  populationDescription?: string;
  reportingStatus?: string;
  paramType?: string;
  dispersionType?: string;
  unitOfMeasure?: string;
  timeFrame?: string;
  typeUnitsAnalyzed?: string;
  groups?: MeasureGroup[];
  classes?: MeasureClass[];
  analyses?: OutcomeAnalysis[];
}

export interface OutcomeAnalysis {
  groupIds: string[];
  nonInferiorityType?: string;
  nonInferiorityComment?: string;
  pValue?: string;
  pValueComment?: string;
  statisticalMethod?: string;
  statisticalComment?: string;
  paramType?: string;
  paramValue?: string;
  ciPctValue?: string;
  ciNumSides?: string;
  ciLowerLimit?: string;
  ciUpperLimit?: string;
  estimateComment?: string;
}

export enum OutcomeMeasureType {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  OTHER_PRE_SPECIFIED = 'OTHER_PRE_SPECIFIED',
  POST_HOC = 'POST_HOC',
}

export interface AdverseEventsModule {
  frequencyThreshold?: string;
  timeFrame?: string;
  description?: string;
  eventGroups: EventGroup[];
  seriousEvents?: AdverseEvent[];
  otherEvents?: AdverseEvent[];
}

export interface EventGroup {
  id: string;
  title: string;
  description?: string;
  deathsNumAffected?: number;
  deathsNumAtRisk?: number;
  seriousNumAffected?: number;
  seriousNumAtRisk?: number;
  otherNumAffected?: number;
  otherNumAtRisk?: number;
}

export interface AdverseEvent {
  term: string;
  organSystem?: string;
  assessmentType?: string;
  notes?: string;
  stats: EventStats[];
}

export interface EventStats {
  groupId: string;
  numEvents?: number;
  numAffected?: number;
  numAtRisk?: number;
}

export interface MoreInfoModule {
  limitationsAndCaveats?: LimitationsAndCaveats;
  certainAgreement?: CertainAgreement;
  pointOfContact?: PointOfContact;
}

export interface LimitationsAndCaveats {
  description?: string;
}

export interface CertainAgreement {
  piSponsorEmployee?: boolean;
  restrictionType?: string;
  restrictiveAgreement?: boolean;
  otherDetails?: string;
}

export interface PointOfContact {
  title?: string;
  organization?: string;
  email?: string;
  phone?: string;
  phoneExt?: string;
}

export const ResultsSectionSchema = z
  .object({
    participantFlowModule: z
      .object({
        preAssignmentDetails: z.string().optional(),
        recruitmentDetails: z.string().optional(),
        typeUnitsAnalyzed: z.string().optional(),
        groups: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            description: z.string().optional(),
          })
        ),
        periods: z.array(
          z.object({
            title: z.string(),
            milestones: z.array(
              z.object({
                type: z.string(),
                comment: z.string().optional(),
                achievements: z.array(
                  z.object({
                    groupId: z.string(),
                    numSubjects: z.string().optional(),
                    numUnits: z.string().optional(),
                    comment: z.string().optional(),
                  })
                ),
              })
            ),
            dropWithdraws: z
              .array(
                z.object({
                  type: z.string(),
                  comment: z.string().optional(),
                  reasons: z.array(
                    z.object({
                      groupId: z.string(),
                      numSubjects: z.string().optional(),
                      numUnits: z.string().optional(),
                      comment: z.string().optional(),
                    })
                  ),
                })
              )
              .optional(),
          })
        ),
      })
      .optional(),

    baselineCharacteristicsModule: z
      .object({
        populationDescription: z.string().optional(),
        typeUnitsAnalyzed: z.string().optional(),
        groups: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            description: z.string().optional(),
          })
        ),
        denoms: z.array(
          z.object({
            units: z.string(),
            counts: z.array(
              z.object({
                groupId: z.string(),
                value: z.string(),
              })
            ),
          })
        ),
        measures: z.array(
          z.object({
            title: z.string(),
            description: z.string().optional(),
            populationDescription: z.string().optional(),
            paramType: z.string(),
            dispersionType: z.string().optional(),
            unitOfMeasure: z.string().optional(),
            classes: z
              .array(
                z.object({
                  title: z.string().optional(),
                  categories: z
                    .array(
                      z.object({
                        title: z.string().optional(),
                        measurements: z.array(
                          z.object({
                            groupId: z.string(),
                            value: z.string().optional(),
                            spread: z.string().optional(),
                            lowerLimit: z.string().optional(),
                            upperLimit: z.string().optional(),
                            comment: z.string().optional(),
                          })
                        ),
                      })
                    )
                    .optional(),
                })
              )
              .optional(),
          })
        ),
      })
      .optional(),

    outcomeMeasuresModule: z
      .object({
        outcomeMeasures: z
          .array(
            z.object({
              type: z.nativeEnum(OutcomeMeasureType), // Use nativeEnum instead of enum
              title: z.string(),
              description: z.string().optional(),
              populationDescription: z.string().optional(),
              reportingStatus: z.string().optional(),
              paramType: z.string().optional(),
              dispersionType: z.string().optional(),
              unitOfMeasure: z.string().optional(),
              timeFrame: z.string().optional(),
              typeUnitsAnalyzed: z.string().optional(),
              groups: z
                .array(
                  z.object({
                    id: z.string(),
                    title: z.string(),
                    description: z.string().optional(),
                  })
                )
                .optional(),
              classes: z
                .array(
                  z.object({
                    title: z.string().optional(),
                    categories: z
                      .array(
                        z.object({
                          title: z.string().optional(),
                          measurements: z.array(
                            z.object({
                              groupId: z.string(),
                              value: z.string().optional(),
                              spread: z.string().optional(),
                              lowerLimit: z.string().optional(),
                              upperLimit: z.string().optional(),
                              comment: z.string().optional(),
                            })
                          ),
                        })
                      )
                      .optional(),
                  })
                )
                .optional(),
              analyses: z
                .array(
                  z.object({
                    groupIds: z.array(z.string()),
                    nonInferiorityType: z.string().optional(),
                    nonInferiorityComment: z.string().optional(),
                    pValue: z.string().optional(),
                    pValueComment: z.string().optional(),
                    statisticalMethod: z.string().optional(),
                    statisticalComment: z.string().optional(),
                    paramType: z.string().optional(),
                    paramValue: z.string().optional(),
                    ciPctValue: z.string().optional(),
                    ciNumSides: z.string().optional(),
                    ciLowerLimit: z.string().optional(),
                    ciUpperLimit: z.string().optional(),
                    estimateComment: z.string().optional(),
                  })
                )
                .optional(),
            })
          )
          .optional(),
      })
      .optional(),

    adverseEventsModule: z
      .object({
        frequencyThreshold: z.string().optional(),
        timeFrame: z.string().optional(),
        description: z.string().optional(),
        eventGroups: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            description: z.string().optional(),
            deathsNumAffected: z.number().optional(),
            deathsNumAtRisk: z.number().optional(),
            seriousNumAffected: z.number().optional(),
            seriousNumAtRisk: z.number().optional(),
            otherNumAffected: z.number().optional(),
            otherNumAtRisk: z.number().optional(),
          })
        ),
        seriousEvents: z
          .array(
            z.object({
              term: z.string(),
              organSystem: z.string().optional(),
              assessmentType: z.string().optional(),
              notes: z.string().optional(),
              stats: z.array(
                z.object({
                  groupId: z.string(),
                  numEvents: z.number().optional(),
                  numAffected: z.number().optional(),
                  numAtRisk: z.number().optional(),
                })
              ),
            })
          )
          .optional(),
        otherEvents: z
          .array(
            z.object({
              term: z.string(),
              organSystem: z.string().optional(),
              assessmentType: z.string().optional(),
              notes: z.string().optional(),
              stats: z.array(
                z.object({
                  groupId: z.string(),
                  numEvents: z.number().optional(),
                  numAffected: z.number().optional(),
                  numAtRisk: z.number().optional(),
                })
              ),
            })
          )
          .optional(),
      })
      .optional(),

    moreInfoModule: z
      .object({
        limitationsAndCaveats: z
          .object({
            description: z.string().optional(),
          })
          .optional(),
        certainAgreement: z
          .object({
            piSponsorEmployee: z.boolean().optional(),
            restrictionType: z.string().optional(),
            restrictiveAgreement: z.boolean().optional(),
            otherDetails: z.string().optional(),
          })
          .optional(),
        pointOfContact: z
          .object({
            title: z.string().optional(),
            organization: z.string().optional(),
            email: z.string().optional(),
            phone: z.string().optional(),
            phoneExt: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .strict();
