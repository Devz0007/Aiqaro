'use client';

import { useUser } from '@clerk/nextjs';
import React from 'react';

import Loader from '@/components/common/loader';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'; // Adjust the import based on your component path
import { useFetchAllBookmarksByUserId } from '@/hooks/bookmarks/use-bookmarks';

const BookmarksPage = (): React.JSX.Element => {
  const { user } = useUser();
  const { data: bookmarks, isLoading: isBookmarksLoading } =
    useFetchAllBookmarksByUserId({
      userId: user?.id ?? '',
      enabled: !!user,
    });
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <p className="text-muted-foreground">
            Browse through your saved clinical trials for quick access.
          </p>
        </div>
        <div>
          {isBookmarksLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarks?.map((bookmark) => (
                <Card key={bookmark.id} className="shadow-md hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="truncate">{bookmark.title}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {bookmark.nct_id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-3">
                      {bookmark.description}
                    </p>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-primary underline text-sm"
                    >
                      View Details
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isBookmarksLoading && bookmarks?.length === 0 && (
            <div className="flex justify-center items-center h-48">
              <p className="text-muted-foreground">No bookmarks found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookmarksPage;
