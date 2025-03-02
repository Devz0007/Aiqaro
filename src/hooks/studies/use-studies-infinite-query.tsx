import {
  InfiniteData,
  useInfiniteQuery,
  UseInfiniteQueryResult,
} from '@tanstack/react-query';

import {
  fetchStudies,
  StudiesResponse,
} from '@/app/dashboard/studies/helpers/fetch-studies';
import { SearchForm } from '@/types/common/form';

export function useStudiesInfiniteQuery(
  formData: SearchForm
): UseInfiniteQueryResult<InfiniteData<StudiesResponse, unknown>, Error> {
  return useInfiniteQuery({
    queryKey: ['studies', formData],
    queryFn: ({ pageParam }) => fetchStudies({ formData, pageParam }),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
  });
}
