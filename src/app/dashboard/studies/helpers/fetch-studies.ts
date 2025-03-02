// src/app/studies/helpers/fetch-studies.ts
import { Study } from '@/types/clinical-trials/study';
import { SearchForm } from '@/types/common/form';

export interface FetchStudiesParams {
  formData: SearchForm;
  pageParam?: string;
}

export interface StudiesResponse {
  studies: Study[];
  totalCount?: number;
  nextPageToken?: string;
}

export async function fetchStudies({
  formData,
  pageParam,
}: FetchStudiesParams): Promise<StudiesResponse> {
  const queryParams = new URLSearchParams();

  if (formData.intervention !== undefined && formData.intervention !== '') {
    queryParams.set('query.intr', formData.intervention);
  }
  if (formData.title !== undefined && formData.title !== '') {
    queryParams.set('query.titles', formData.title);
  }
  if (formData.outcome !== undefined && formData.outcome !== '') {
    queryParams.set('query.outc', formData.outcome);
  }
  if (formData.sponsor !== undefined && formData.sponsor !== '') {
    queryParams.set('query.spons', formData.sponsor);
  }
  if (formData.studyId !== undefined && formData.studyId !== '') {
    queryParams.set('query.id', formData.studyId);
  }
  if (formData.location !== undefined && formData.location !== '') {
    queryParams.set('location', formData.location);
  }
  if (formData.phase !== undefined) {
    queryParams.set('phase', formData.phase.join(','));
  }
  if (formData.status !== undefined) {
    queryParams.set('status', formData.status.join(','));
  }
  if (formData.therapeuticArea !== undefined) {
    queryParams.set('area', formData.therapeuticArea.join(','));
  }
  if (formData.searchTerm !== undefined && formData.searchTerm !== '') {
    queryParams.set('term', formData.searchTerm);
  }
  if (formData.gender !== undefined) {
    queryParams.set('gender', formData.gender);
  }
  if (formData.healthyVolunteers) {
    queryParams.set('healthy', 'true');
  }
  if (formData.minAge !== undefined && formData.minAge !== '') {
    queryParams.set('minAge', formData.minAge);
  }
  if (formData.maxAge !== undefined && formData.maxAge !== '') {
    queryParams.set('maxAge', formData.maxAge);
  }

  if (
    formData.sortField !== undefined &&
    formData.sortDirection !== undefined
  ) {
    queryParams.set('sort', `${formData.sortField}:${formData.sortDirection}`);
  }

  // Add the page token if it's defined (for pagination)
  if (pageParam !== undefined) {
    queryParams.set('pageToken', pageParam);
  }

  const response = await fetch(`/api/studies?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error('Search request failed');
  }

  const data = (await response.json()) as StudiesResponse;

  return data;
}
