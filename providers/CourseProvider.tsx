import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Course,
  CourseContext,
  loadBookmarks,
  loadEnrolled,
  saveBookmarks,
  saveEnrolled,
} from '../store/courseStore';
import { sendBookmarkNotification } from '../utils/notifications';

export default function CourseProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [enrolled, setEnrolled] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);

  useEffect(() => {
    loadBookmarks().then(setBookmarks);
    loadEnrolled().then(setEnrolled);
  }, []);

  const toggleBookmark = useCallback(
    async (id: string) => {
      setBookmarks((prev) => {
        const next = prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id];
        saveBookmarks(next);
        if (next.length === 5) {
          sendBookmarkNotification(5);
        }
        return next;
      });
    },
    []
  );

  const toggleEnroll = useCallback(async (id: string) => {
    setEnrolled((prev) => {
      const next = prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id];
      saveEnrolled(next);
      return next;
    });
  }, []);

  const refresh = useCallback(() => setRefreshFlag((f) => f + 1), []);

  const value = useMemo(
    () => ({
      courses,
      bookmarks,
      enrolled,
      isLoading,
      error,
      setCourses,
      setIsLoading,
      setError,
      toggleBookmark,
      toggleEnroll,
      refresh,
    }),
    [courses, bookmarks, enrolled, isLoading, error, toggleBookmark, toggleEnroll, refresh]
  );

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}
