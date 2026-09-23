import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Course,
  CourseContext,
  loadBookmarks,
  loadEnrolled,
  saveBookmarks,
  saveEnrolled,
} from '../store/courseStore';

import { sendBookmarkNotification } from '../utils/notifications';

import { useAuth } from '../store/authStore';

export default function CourseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [enrolled, setEnrolled] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);

  /*
   * Load data whenever the logged-in user changes.
   *
   * user._id makes the storage completely user-specific.
   */
  useEffect(() => {
    let cancelled = false;

    const loadUserCourseData = async () => {
      if (!user?._id) {
        setBookmarks([]);
        setEnrolled([]);
        return;
      }

      setIsLoading(true);

      try {
        const [userBookmarks, userEnrolled] =
          await Promise.all([
            loadBookmarks(user._id),
            loadEnrolled(user._id),
          ]);

        if (cancelled) return;

        setBookmarks(userBookmarks);
        setEnrolled(userEnrolled);
      } catch (err) {
        console.error(
          'Failed to load user course data:',
          err
        );

        if (!cancelled) {
          setBookmarks([]);
          setEnrolled([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadUserCourseData();

    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  const toggleBookmark = useCallback(
    async (id: string) => {
      if (!user?._id) return;

      setBookmarks((prev) => {
        const next = prev.includes(id)
          ? prev.filter((b) => b !== id)
          : [...prev, id];

        void saveBookmarks(user._id, next);

        if (next.length === 5) {
          void sendBookmarkNotification(5);
        }

        return next;
      });
    },
    [user?._id]
  );

  const toggleEnroll = useCallback(
    async (id: string) => {
      if (!user?._id) return;

      setEnrolled((prev) => {
        const next = prev.includes(id)
          ? prev.filter((e) => e !== id)
          : [...prev, id];

        void saveEnrolled(user._id, next);

        return next;
      });
    },
    [user?._id]
  );

  const refresh = useCallback(
    () => setRefreshFlag((f) => f + 1),
    []
  );

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
    [
      courses,
      bookmarks,
      enrolled,
      isLoading,
      error,
      toggleBookmark,
      toggleEnroll,
      refresh,
    ]
  );

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
}