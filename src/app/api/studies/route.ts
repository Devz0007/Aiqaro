// src/app/api/studies/route.ts
import { NextResponse } from 'next/server';

import { api, ClinicalTrialsApiError } from '@/lib/api/clinical-trials';
import { STUDIES_PER_PAGE } from '@/lib/constants/studies';
import {
  SearchFiltersSchema,
  type SearchFilters,
  StudyPhase,
  StudyStatus,
  SortField,
  SortDirection,
  Sex,
} from '@/types/clinical-trials/filters';
import type { SearchParams } from '@/types/clinical-trials/search';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate incoming filters
    const filters: SearchFilters = {
      phase: searchParams.has('phase')
        ? (searchParams
            .get('phase')
            ?.split(',')
            .filter((p) => p.trim() !== '') as StudyPhase[])
        : undefined,
      status: searchParams.has('status')
        ? (searchParams
            .get('status')
            ?.split(',')
            .filter((s) => s.trim() !== '') as StudyStatus[])
        : undefined,
      location: searchParams.get('location')?.trim() ?? undefined,
      therapeuticArea: searchParams.has('area')
        ? searchParams
            .get('area')
            ?.split(',')
            .filter((a) => a.trim() !== '')
        : undefined,
      gender: (searchParams.get('gender') as Sex) ?? undefined,
      healthyVolunteers: searchParams.get('healthy') === 'true',
      minAge: searchParams.get('minAge')?.trim() ?? undefined,
      maxAge: searchParams.get('maxAge')?.trim() ?? undefined,
      sort: searchParams.has('sort')
        ? {
            field: searchParams.get('sort')?.split(':')[0] as SortField,
            direction: searchParams.get('sort')?.split(':')[1] as SortDirection,
          }
        : undefined,
    };

    const validatedFilters = SearchFiltersSchema.parse(filters);

    // Initialize params
    const params: Partial<SearchParams> = {
      format: 'json',
      pageSize: Math.min(
        parseInt(
          searchParams.get('pageSize') ?? STUDIES_PER_PAGE.toString(),
          10
        ),
        1000
      ),
      countTotal: true,
    };

    // Pagination token
    if (searchParams.has('pageToken') && searchParams.get('pageToken') !== '') {
      params.pageToken = searchParams.get('pageToken') ?? undefined;
    }

    const searchQueries: string[] = [];
    const advancedQueries: string[] = [];

    // Add location
    if (validatedFilters.location !== undefined) {
      advancedQueries.push(`AREA[LocationCountry]${validatedFilters.location}`);
    }

    // Add therapeutic area
    if (
      validatedFilters.therapeuticArea !== undefined &&
      validatedFilters.therapeuticArea?.length > 0
    ) {
      const areaQueries = validatedFilters.therapeuticArea.map(
        (area) => `AREA[Condition]${area}`
      );
      advancedQueries.push(`(${areaQueries.join(' OR ')})`);
    }

    // Add phases
    if (
      validatedFilters.phase !== undefined &&
      validatedFilters.phase?.length > 0
    ) {
      const phaseQueries = validatedFilters.phase.map(
        (phase) => `AREA[Phase]${phase}`
      );
      advancedQueries.push(`(${phaseQueries.join(' OR ')})`);
    }

    // Add statuses
    if (
      validatedFilters.status !== undefined &&
      validatedFilters.status?.length > 0
    ) {
      const statusQueries = validatedFilters.status.map(
        (status) => `AREA[OverallStatus]${status}`
      );
      advancedQueries.push(`(${statusQueries.join(' OR ')})`);
    }

    // Add gender
    if (validatedFilters.gender !== undefined) {
      advancedQueries.push(`AREA[Sex]${validatedFilters.gender}`);
    }

    // Add age ranges
    if (validatedFilters.minAge !== undefined) {
      advancedQueries.push(
        `AREA[MinimumAge]RANGE[${validatedFilters.minAge} years, MAX]`
      );
    }
    if (validatedFilters.maxAge !== undefined) {
      advancedQueries.push(
        `AREA[MaximumAge]RANGE[MIN, ${validatedFilters.maxAge} years]`
      );
    }

    // Add healthy volunteers filter
    if (validatedFilters.healthyVolunteers === true) {
      advancedQueries.push('AREA[HealthyVolunteers]Y');
    }

    // Combine advanced queries with other search terms
    if (advancedQueries.length > 0) {
      searchQueries.push(advancedQueries.join(' AND '));
    }

    if (searchParams.has('term')) {
      searchQueries.push(searchParams.get('term') as string);
    }

    // Add query terms
    if (searchQueries.length > 0) {
      params['query.term'] = searchQueries.join(' AND ');
    }

    // Sort options
    params.sort = validatedFilters.sort
      ? [`${validatedFilters.sort.field}:${validatedFilters.sort.direction}`]
      : ['LastUpdatePostDate:desc'];

    // Call the API
    const result = await api.search(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error,
    });

    if (error instanceof ClinicalTrialsApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status ?? 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
