// src/lib/api/clinical-trials.ts
import { cache } from 'react';
import { z } from 'zod';

import {
  SearchParams,
  SearchParamsSchema,
  SearchResponse,
  SearchResponseSchema,
} from '@/types/clinical-trials/search';
import { StudySchema, type Study } from '@/types/clinical-trials/study';

import { STUDIES_PER_PAGE } from '../constants/studies';

export class ClinicalTrialsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ClinicalTrialsApiError';
  }
}

interface ClinicalTrialsApiConfig {
  baseUrl?: string;
  defaultPageSize?: number;
  cacheDuration?: number;
}

interface RawJsonResponse {
  [key: string]: unknown;
}

export class ClinicalTrialsApi {
  private readonly baseUrl: string;
  private readonly defaultPageSize: number;
  private readonly cacheDuration: number;

  constructor(config: ClinicalTrialsApiConfig = {}) {
    this.baseUrl = config.baseUrl ?? 'https://clinicaltrials.gov/api/v2';
    this.defaultPageSize = config.defaultPageSize ?? 20;
    this.cacheDuration =
      config.cacheDuration ??
      (process.env.API_CACHE_DURATION !== undefined
        ? parseInt(process.env.API_CACHE_DURATION)
        : 300);
  }

  public readonly cachedSearch = cache(this.search.bind(this));

  public async search(params: Partial<SearchParams>): Promise<SearchResponse> {
    try {
      const searchParams = SearchParamsSchema.parse({
        ...params,
        pageSize: params.pageSize ?? this.defaultPageSize,
        format: 'json',
        countTotal: true,
      });

      const queryParams = new URLSearchParams();

      Object.entries(searchParams).forEach(([key, value]): void => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach((v): void => {
              if (v !== null && v !== undefined) {
                queryParams.append(key, v.toString());
              }
            });
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });

      const response = await fetch(
        `${this.baseUrl}/studies?${queryParams.toString()}`,
        {
          headers: {
            Accept: 'application/json',
          },
          next: {
            revalidate: this.cacheDuration,
          },
        }
      );
      if (!response.ok) {
        throw new ClinicalTrialsApiError(
          'Failed to fetch studies',
          response.status
        );
      }

      const rawData = (await response.json()) as RawJsonResponse;

      const data = SearchResponseSchema.parse(rawData);

      return {
        studies: data.studies,
        totalCount: data.totalCount,
        nextPageToken: data.nextPageToken,
      };
    } catch (error) {
      console.error('Search error:', error);
      if (error instanceof z.ZodError) {
        console.error('Zod error:', error);
        throw new ClinicalTrialsApiError(
          'Invalid search parameters',
          400,
          'INVALID_PARAMS'
        );
      }
      throw error;
    }
  }

  public async getStudy(nctId: string): Promise<Study> {
    if (!nctId.match(/^NCT\d{8}$/)) {
      throw new ClinicalTrialsApiError(
        'Invalid NCT ID format',
        400,
        'INVALID_NCT_ID'
      );
    }

    const response = await fetch(`${this.baseUrl}/studies/${nctId}`, {
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: this.cacheDuration,
      },
    });

    if (!response.ok) {
      throw new ClinicalTrialsApiError(
        'Failed to fetch study',
        response.status
      );
    }

    const rawData = (await response.json()) as RawJsonResponse;
    return StudySchema.parse(rawData);
  }

  public async getFieldStats(
    fields: string[]
  ): Promise<Record<string, unknown>> {
    if (fields.length === 0) {
      throw new ClinicalTrialsApiError(
        'At least one field must be specified',
        400,
        'INVALID_PARAMS'
      );
    }

    const queryParams = new URLSearchParams();
    fields.forEach((field): void => {
      if (field !== null && field !== undefined) {
        queryParams.append('fields', field);
      }
    });

    const response = await fetch(
      `${this.baseUrl}/stats/field/values?${queryParams.toString()}`,
      {
        headers: {
          Accept: 'application/json',
        },
        next: {
          revalidate: this.cacheDuration,
        },
      }
    );

    if (!response.ok) {
      throw new ClinicalTrialsApiError(
        'Failed to fetch field statistics',
        response.status
      );
    }

    const rawData = (await response.json()) as RawJsonResponse;
    return z.record(z.unknown()).parse(rawData);
  }
}

export const api = new ClinicalTrialsApi({
  cacheDuration:
    process.env.API_CACHE_DURATION !== undefined
      ? parseInt(process.env.API_CACHE_DURATION)
      : undefined,
  defaultPageSize: STUDIES_PER_PAGE,
});
