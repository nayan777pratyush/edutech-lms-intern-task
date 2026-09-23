import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext } from 'react';

export interface Course {
  id: string | number;
  title: string;
  description: string;
  price: number;
  category: string;
  thumbnail: string;
  rating: number;
  difficulty?: string;
  instructorName?: string;
  instructorAvatar?: string;
}

function getBookmarksKey(userId: string) {
  return `bookmarked_courses_${userId}`;
}

function getEnrolledKey(userId: string) {
  return `enrolled_courses_${userId}`;
}

export async function loadBookmarks(userId: string): Promise<string[]> {
  const data = await AsyncStorage.getItem(getBookmarksKey(userId));
  return data ? JSON.parse(data) : [];
}

export async function saveBookmarks(
  userId: string,
  ids: string[]
): Promise<void> {
  await AsyncStorage.setItem(
    getBookmarksKey(userId),
    JSON.stringify(ids)
  );
}

export async function loadEnrolled(userId: string): Promise<string[]> {
  const data = await AsyncStorage.getItem(getEnrolledKey(userId));
  return data ? JSON.parse(data) : [];
}

export async function saveEnrolled(
  userId: string,
  ids: string[]
): Promise<void> {
  await AsyncStorage.setItem(
    getEnrolledKey(userId),
    JSON.stringify(ids)
  );
}

export interface CourseContextType {
  courses: Course[];
  bookmarks: string[];
  enrolled: string[];
  isLoading: boolean;
  error: string | null;
  setCourses: (courses: Course[]) => void;
  setIsLoading: (val: boolean) => void;
  setError: (msg: string | null) => void;
  toggleBookmark: (id: string) => Promise<void>;
  toggleEnroll: (id: string) => Promise<void>;
  refresh: () => void;
}

export const CourseContext = createContext<CourseContextType | null>(null);

export function useCourses() {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error('useCourses must be used inside CourseProvider');
  return ctx;
}
