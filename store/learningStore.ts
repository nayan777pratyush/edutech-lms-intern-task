import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'reading';
  duration: string;
  description: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  quizId: string;
}

export interface LearningProgress {
  completedLessons: string[];
  currentLessonId: string | null;
  quizScores: Record<string, number>;
  passedModules: string[];
  courseCompleted: boolean;
}

function getProgressKey(userId: string, courseId: string) {
  return `learning_progress_${userId}_${courseId}`;
}

export function createEmptyProgress(): LearningProgress {
  return {
    completedLessons: [],
    currentLessonId: null,
    quizScores: {},
    passedModules: [],
    courseCompleted: false,
  };
}

export async function loadLearningProgress(
  userId: string,
  courseId: string
): Promise<LearningProgress> {
  const stored = await AsyncStorage.getItem(
    getProgressKey(userId, courseId)
  );

  if (!stored) {
    return createEmptyProgress();
  }

  try {
    const parsed = JSON.parse(stored) as Partial<LearningProgress>;

    return {
      completedLessons: Array.isArray(parsed.completedLessons)
        ? parsed.completedLessons
        : [],

      currentLessonId:
        typeof parsed.currentLessonId === 'string'
          ? parsed.currentLessonId
          : null,

      quizScores:
        parsed.quizScores &&
        typeof parsed.quizScores === 'object'
          ? parsed.quizScores
          : {},

      passedModules: Array.isArray(parsed.passedModules)
        ? parsed.passedModules
        : [],

      courseCompleted:
        parsed.courseCompleted === true,
    };
  } catch {
    return createEmptyProgress();
  }
}

export async function saveLearningProgress(
  userId: string,
  courseId: string,
  progress: LearningProgress
) {
  await AsyncStorage.setItem(
    getProgressKey(userId, courseId),
    JSON.stringify(progress)
  );
}

export const getCourseModules = (
  courseId: string
): Module[] => [
  {
    id: `${courseId}-module-1`,
    title: 'Module 1 - Introduction',
    description:
      'Learn the fundamentals and build a strong foundation.',
    quizId: `${courseId}-module-1-quiz`,
    lessons: [
      {
        id: `${courseId}-module-1-lesson-1`,
        title: 'Introduction',
        type: 'video',
        duration: '8 min',
        description:
          'Understand the fundamentals and learning objectives.',
      },
      {
        id: `${courseId}-module-1-lesson-2`,
        title: 'Getting Started',
        type: 'video',
        duration: '12 min',
        description:
          'Set up the basics and understand the core concepts.',
      },
      {
        id: `${courseId}-module-1-lesson-3`,
        title: 'Core Concepts',
        type: 'reading',
        duration: '10 min',
        description:
          'Explore the important concepts covered in this module.',
      },
      {
        id: `${courseId}-module-1-lesson-4`,
        title: 'Practical Application',
        type: 'video',
        duration: '15 min',
        description:
          'Apply what you have learned through practical examples.',
      },
      {
        id: `${courseId}-module-1-lesson-5`,
        title: 'Module Review',
        type: 'reading',
        duration: '10 min',
        description:
          'Review the important concepts before taking the quiz.',
      },
    ],
  },

  {
    id: `${courseId}-module-2`,
    title: 'Module 2 - Core Concepts',
    description:
      'Develop deeper knowledge and practical understanding.',
    quizId: `${courseId}-module-2-quiz`,
    lessons: [
      {
        id: `${courseId}-module-2-lesson-1`,
        title: 'Essential Concepts',
        type: 'video',
        duration: '10 min',
        description:
          'Learn the essential concepts for this module.',
      },
      {
        id: `${courseId}-module-2-lesson-2`,
        title: 'Working with Concepts',
        type: 'reading',
        duration: '12 min',
        description:
          'Understand how the core concepts work together.',
      },
      {
        id: `${courseId}-module-2-lesson-3`,
        title: 'Hands-on Practice',
        type: 'video',
        duration: '15 min',
        description:
          'Practice the concepts through practical examples.',
      },
      {
        id: `${courseId}-module-2-lesson-4`,
        title: 'Problem Solving',
        type: 'video',
        duration: '14 min',
        description:
          'Apply your knowledge to common problems.',
      },
      {
        id: `${courseId}-module-2-lesson-5`,
        title: 'Module Review',
        type: 'reading',
        duration: '10 min',
        description:
          'Review the module before attempting the quiz.',
      },
    ],
  },

  {
    id: `${courseId}-module-3`,
    title: 'Module 3 - Project Building',
    description:
      'Apply your knowledge through project-based learning.',
    quizId: `${courseId}-module-3-quiz`,
    lessons: [
      {
        id: `${courseId}-module-3-lesson-1`,
        title: 'Project Planning',
        type: 'video',
        duration: '10 min',
        description:
          'Learn how to plan and structure a project.',
      },
      {
        id: `${courseId}-module-3-lesson-2`,
        title: 'Implementation Basics',
        type: 'reading',
        duration: '14 min',
        description:
          'Understand the important implementation steps.',
      },
      {
        id: `${courseId}-module-3-lesson-3`,
        title: 'Building the Project',
        type: 'video',
        duration: '18 min',
        description:
          'Work through the major stages of project development.',
      },
      {
        id: `${courseId}-module-3-lesson-4`,
        title: 'Testing',
        type: 'video',
        duration: '12 min',
        description:
          'Learn how to test and validate your work.',
      },
      {
        id: `${courseId}-module-3-lesson-5`,
        title: 'Project Review',
        type: 'reading',
        duration: '10 min',
        description:
          'Review the complete project workflow.',
      },
    ],
  },

  {
    id: `${courseId}-module-4`,
    title: 'Module 4 - Advanced Features',
    description:
      'Explore advanced concepts and challenging applications.',
    quizId: `${courseId}-module-4-quiz`,
    lessons: [
      {
        id: `${courseId}-module-4-lesson-1`,
        title: 'Advanced Concepts',
        type: 'video',
        duration: '14 min',
        description:
          'Explore advanced concepts related to the course.',
      },
      {
        id: `${courseId}-module-4-lesson-2`,
        title: 'Advanced Techniques',
        type: 'reading',
        duration: '15 min',
        description:
          'Learn techniques used in advanced scenarios.',
      },
      {
        id: `${courseId}-module-4-lesson-3`,
        title: 'Practical Challenge',
        type: 'video',
        duration: '18 min',
        description:
          'Apply advanced knowledge to a practical challenge.',
      },
      {
        id: `${courseId}-module-4-lesson-4`,
        title: 'Optimization',
        type: 'video',
        duration: '12 min',
        description:
          'Learn how to improve and optimize your solution.',
      },
      {
        id: `${courseId}-module-4-lesson-5`,
        title: 'Advanced Review',
        type: 'reading',
        duration: '10 min',
        description:
          'Review the advanced concepts before the quiz.',
      },
    ],
  },

  {
    id: `${courseId}-module-5`,
    title: 'Module 5 - Deployment',
    description:
      'Bring everything together and complete the learning path.',
    quizId: `${courseId}-module-5-quiz`,
    lessons: [
      {
        id: `${courseId}-module-5-lesson-1`,
        title: 'Deployment Preparation',
        type: 'video',
        duration: '12 min',
        description:
          'Prepare your project for deployment.',
      },
      {
        id: `${courseId}-module-5-lesson-2`,
        title: 'Deployment Concepts',
        type: 'reading',
        duration: '14 min',
        description:
          'Understand the key concepts involved in deployment.',
      },
      {
        id: `${courseId}-module-5-lesson-3`,
        title: 'Final Implementation',
        type: 'video',
        duration: '18 min',
        description:
          'Put everything you have learned into practice.',
      },
      {
        id: `${courseId}-module-5-lesson-4`,
        title: 'Final Testing',
        type: 'video',
        duration: '12 min',
        description:
          'Perform final testing and validation.',
      },
      {
        id: `${courseId}-module-5-lesson-5`,
        title: 'Final Review',
        type: 'reading',
        duration: '10 min',
        description:
          'Complete the final review before the course quiz.',
      },
    ],
  },
];