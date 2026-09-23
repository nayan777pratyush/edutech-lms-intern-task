import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Colors } from '../../constants/colors';
import { useAuth } from '../../store/authStore';
import { useCourses } from '../../store/courseStore';
import {
  getCourseLessons,
  loadLearningProgress,
  saveLearningProgress,
  Lesson,
  LearningProgress,
} from '../../store/learningStore';

export default function LearningHubScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { enrolled, courses } = useCourses();

  const { id, title } = useLocalSearchParams<{
    id: string;
    title?: string;
  }>();

  const courseId = String(id);

  const course = courses.find(
    (item) => String(item.id) === courseId
  );

  const courseTitle = title || course?.title || 'Course';

  const lessons = useMemo(
    () => getCourseLessons(courseId),
    [courseId]
  );

  const [progress, setProgress] = useState<LearningProgress>({
    completedLessons: [],
    currentLessonId: null,
  });

  const [isLoading, setIsLoading] = useState(true);

  const isEnrolled = enrolled.includes(courseId);

  useEffect(() => {
    let cancelled = false;

    const loadProgress = async () => {
      if (!user?._id || !courseId) {
        setIsLoading(false);
        return;
      }

      try {
        const saved = await loadLearningProgress(
          user._id,
          courseId
        );

        if (!cancelled) {
          setProgress(saved);
        }
      } catch (error) {
        console.error(
          'Failed to load learning progress:',
          error
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [user?._id, courseId]);

  const completedCount = progress.completedLessons.length;

  const progressPercentage =
    lessons.length === 0
      ? 0
      : Math.round((completedCount / lessons.length) * 100);

  const markLessonComplete = async (lesson: Lesson) => {
    if (!user?._id) return;

    const alreadyCompleted =
      progress.completedLessons.includes(lesson.id);

    if (alreadyCompleted) {
      return;
    }

    const nextProgress: LearningProgress = {
      completedLessons: [
        ...progress.completedLessons,
        lesson.id,
      ],
      currentLessonId: lesson.id,
    };

    setProgress(nextProgress);

    await saveLearningProgress(
      user._id,
      courseId,
      nextProgress
    );
  };

  const openLesson = async (lesson: Lesson) => {
    if (lesson.type === 'quiz') {
      router.push({
        pathname: '/learning/quiz',
        params: {
          courseId,
          title: courseTitle,
        },
      });

      return;
    }

    await markLessonComplete(lesson);
  };

  if (!isEnrolled) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Ionicons
          name="lock-closed-outline"
          size={52}
          color={Colors.textSecondary}
        />

        <Text className="text-xl font-extrabold text-foreground mt-4 text-center">
          Course Locked
        </Text>

        <Text className="text-sm text-muted text-center mt-2">
          You need to enroll in this course before accessing the
          Learning Hub.
        </Text>

        <TouchableOpacity
          className="bg-primary rounded-xl px-6 py-3.5 mt-6"
          onPress={() =>
            router.replace({
              pathname: '/course/[id]',
              params: { id: courseId },
            })
          }
        >
          <Text className="text-white font-bold">
            Go to Course
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text className="text-muted mt-3">
          Loading your progress...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-10"
    >
      <View className="p-4">

        {/* Header */}
        <View className="mb-6">
          <Text className="text-xs font-bold text-primary uppercase">
            Learning Hub
          </Text>

          <Text className="text-2xl font-extrabold text-foreground mt-1">
            {courseTitle}
          </Text>

          <Text className="text-sm text-muted mt-2">
            Continue learning from where you left off.
          </Text>
        </View>

        {/* Progress Card */}
        <View className="bg-surface rounded-2xl border border-border p-5 mb-6">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-sm font-bold text-foreground">
                Course Progress
              </Text>

              <Text className="text-xs text-muted mt-1">
                {completedCount} of {lessons.length} lessons completed
              </Text>
            </View>

            <Text className="text-2xl font-extrabold text-primary">
              {progressPercentage}%
            </Text>
          </View>

          <View className="h-3 bg-border rounded-full overflow-hidden mt-4">
            <View
              className="h-full bg-primary rounded-full"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </View>

          {progressPercentage === 100 && (
            <View className="flex-row items-center mt-4">
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={Colors.success}
              />

              <Text className="text-sm font-semibold text-success ml-2">
                Course completed! 🎉
              </Text>
            </View>
          )}
        </View>

        {/* Lessons */}
        <Text className="text-lg font-extrabold text-foreground mb-3">
          Course Content
        </Text>

        {lessons.map((lesson, index) => {
          const completed =
            progress.completedLessons.includes(lesson.id);

          const isCurrent =
            progress.currentLessonId === lesson.id;

          return (
            <TouchableOpacity
              key={lesson.id}
              onPress={() => openLesson(lesson)}
              className={`bg-surface rounded-xl border p-4 mb-3 ${
                completed
                  ? 'border-success'
                  : isCurrent
                    ? 'border-primary'
                    : 'border-border'
              }`}
            >
              <View className="flex-row items-center">

                <View
                  className={`w-11 h-11 rounded-full items-center justify-center ${
                    completed
                      ? 'bg-success'
                      : 'bg-primary-light'
                  }`}
                >
                  <Ionicons
                    name={
                      completed
                        ? 'checkmark'
                        : lesson.type === 'video'
                          ? 'play'
                          : lesson.type === 'reading'
                            ? 'book-outline'
                            : 'help-circle-outline'
                    }
                    size={21}
                    color={
                      completed
                        ? '#FFFFFF'
                        : Colors.primary
                    }
                  />
                </View>

                <View className="flex-1 ml-3">
                  <Text className="text-xs text-muted">
                    LESSON {index + 1}
                  </Text>

                  <Text className="text-base font-bold text-foreground mt-0.5">
                    {lesson.title}
                  </Text>

                  <Text
                    className="text-xs text-muted mt-1"
                    numberOfLines={2}
                  >
                    {lesson.description}
                  </Text>

                  {lesson.duration && (
                    <Text className="text-xs text-muted mt-2">
                      {lesson.duration}
                    </Text>
                  )}
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Resume */}
        {progress.currentLessonId && (
          <View className="bg-primary-light rounded-xl p-4 mt-2">
            <View className="flex-row items-center">
              <Ionicons
                name="play-circle"
                size={24}
                color={Colors.primary}
              />

              <View className="flex-1 ml-3">
                <Text className="text-sm font-bold text-primary">
                  Keep learning
                </Text>

                <Text className="text-xs text-muted mt-1">
                  Your progress is saved automatically.
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}