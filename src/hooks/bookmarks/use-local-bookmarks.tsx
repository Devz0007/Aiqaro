'use client';

import { useState, useEffect, useCallback } from 'react';

export type LocalBookmark = {
  nct_id: string;
  title: string;
  url: string;
  created_time: string;
};

export const useLocalBookmarks = (userId: string) => {
  const [bookmarks, setBookmarks] = useState<LocalBookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load bookmarks from localStorage
  useEffect(() => {
    if (!userId) {
      setBookmarks([]);
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(`local_bookmarks_${userId}`);
      setBookmarks(stored ? JSON.parse(stored) : []);
    } catch (e) {
      console.error('[LOCAL BOOKMARKS] Error loading from localStorage:', e);
      setBookmarks([]);
    }
    setIsLoading(false);
  }, [userId]);

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    if (!userId) return;
    try {
      localStorage.setItem(`local_bookmarks_${userId}`, JSON.stringify(bookmarks));
      console.log('[LOCAL BOOKMARKS] Saved bookmarks:', bookmarks.length);
    } catch (e) {
      console.error('[LOCAL BOOKMARKS] Error saving to localStorage:', e);
    }
  }, [bookmarks, userId]);

  const toggleBookmark = useCallback((
    nctId: string, 
    title: string, 
    url: string,
    onRemove?: () => void
  ) => {
    setBookmarks(current => {
      const exists = current.some(b => b.nct_id === nctId);
      
      if (exists) {
        // Remove the bookmark
        console.log('[LOCAL BOOKMARKS] Removing bookmark:', nctId);
        // Call onRemove callback if provided
        onRemove?.();
        return current.filter(b => b.nct_id !== nctId);
      } else {
        // Add new bookmark
        console.log('[LOCAL BOOKMARKS] Adding bookmark:', nctId);
        return [...current, {
          nct_id: nctId,
          title,
          url,
          created_time: new Date().toISOString()
        }];
      }
    });
  }, []);

  const isBookmarked = useCallback((nctId: string) => {
    return bookmarks.some(b => b.nct_id === nctId);
  }, [bookmarks]);

  return {
    bookmarks,
    isLoading,
    toggleBookmark,
    isBookmarked
  };
}; 