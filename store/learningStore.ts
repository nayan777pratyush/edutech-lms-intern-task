import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'quiz';
  duration?: string;
  description: string;
}

export interface LearningProgress {
  completedLessons: string[];
  currentLessonId: string | null;
}

function getProgressKey(userId: string, courseId: string) {
  return `learning_progress_${userId}_${courseId}`;
}

export async function loadLearningProgress(
  userId: string,
  courseId: string
): Promise<LearningProgress> {
  const data = await AsyncStorage.getItem(
    getProgressKey(userId, courseId)
  );

  if (!data) {
    return {
      completedLessons: [],
      currentLessonId: null,
    };
  }

  try {
    return JSON.parse(data) as LearningProgress;
  } catch {
    return {
      completedLessons: [],
      currentLessonId: null,
    };
  }
}

export async function saveLearningProgress(
  userId: string,
  courseId: string,
  progress: LearningProgress
): Promise<void> {
  await AsyncStorage.setItem(
    getProgressKey(userId, courseId),
    JSON.stringify(progress)
  );
}

export const getCourseLessons = (
  courseId: string
): Lesson[] => [
  {
    id: `${courseId}-lesson-1`,
    title: 'Introduction',
    type: 'video',
    duration: '8 min',
    description:
      'Understand the fundamentals and learning objectives of this course.',
  },
  {
    id: `${courseId}-lesson-2`,
    title: 'Getting Started',
    type: 'video',
    duration: '12 min',
    description:
      'Set up the basics and understand the core concepts.',
  },
  {
    id: `${courseId}-lesson-3`,
    title: 'Core Concepts',
    type: 'reading',
    duration: '10 min',
    description:
      'Explore the important concepts covered in this course.',
  },
  {
    id: `${courseId}-lesson-4`,
    title: 'Practical Application',
    type: 'video',
    duration: '15 min',
    description:
      'Apply what you have learned through practical examples.',
  },
  {
    id: `${courseId}-lesson-5`,
    title: 'Final Quiz',
    type: 'quiz',
    duration: '5 min',
    description:
      'Test your understanding of the course.',
  },
];