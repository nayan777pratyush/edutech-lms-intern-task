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

const BOOKMARKS_KEY = 'bookmarked_courses';
const ENROLLED_KEY = 'enrolled_courses';

export async function loadBookmarks(): Promise<string[]> {
  const data = await AsyncStorage.getItem(BOOKMARKS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveBookmarks(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(ids));
}

export async function loadEnrolled(): Promise<string[]> {
  const data = await AsyncStorage.getItem(ENROLLED_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveEnrolled(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(ENROLLED_KEY, JSON.stringify(ids));
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
