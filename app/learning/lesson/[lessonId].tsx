import React, { useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { Colors } from '../../../constants/colors';

import { useAuth } from '../../../store/authStore';

import { useCourses } from '../../../store/courseStore';

import {
  getCourseModules,
  loadLearningProgress,
  saveLearningProgress,
  LearningProgress,
  Lesson,
} from '../../../store/learningStore';

export default function LessonStudyScreen() {
  const router = useRouter();

  const { user } = useAuth();
  const { enrolled, courses } = useCourses();

  const {
    lessonId,
    courseId,
    title,
    moduleId,
  } = useLocalSearchParams<{
    lessonId: string;
    courseId: string;
    title?: string;
    moduleId?: string;
  }>();

  const courseIdValue = String(courseId);
  const lessonIdValue = String(lessonId);

  const course = courses.find(
    (item) => String(item.id) === courseIdValue
  );

  const courseTitle =
    title || course?.title || 'Course';

  const modules = useMemo(
    () => getCourseModules(courseIdValue),
    [courseIdValue]
  );

  const currentModule = useMemo(() => {
    if (moduleId) {
      return modules.find(
        (module) => module.id === String(moduleId)
      );
    }

    return modules.find((module) =>
      module.lessons.some(
        (lesson) => lesson.id === lessonIdValue
      )
    );
  }, [modules, moduleId, lessonIdValue]);

  const lesson = useMemo<Lesson | undefined>(() => {
    return currentModule?.lessons.find(
      (item) => item.id === lessonIdValue
    );
  }, [currentModule, lessonIdValue]);

  const [progress, setProgress] =
    useState<LearningProgress | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const isEnrolled =
    enrolled.includes(courseIdValue);

  /*
   * Load the student's learning progress.
   */
  useEffect(() => {
    let cancelled = false;

    const loadProgress = async () => {
      if (!user?._id || !courseIdValue) {
        setIsLoading(false);
        return;
      }

      try {
        const saved = await loadLearningProgress(
          user._id,
          courseIdValue
        );

        if (!cancelled) {
          setProgress(saved);
        }
      } catch (error) {
        console.error(
          'Failed to load lesson progress:',
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
  }, [user?._id, courseIdValue]);

  /*
   * Check whether this lesson has already been completed.
   */
  const isCompleted =
    !!progress &&
    progress.completedLessons.includes(
      lessonIdValue
    );

  /*
   * Enforce lesson order.
   *
   * Lesson 1 -> available
   * Lesson 2 -> only after Lesson 1
   * Lesson 3 -> only after Lesson 2
   * etc.
   */
  const lessonIndex =
    currentModule?.lessons.findIndex(
      (item) => item.id === lessonIdValue
    ) ?? -1;

  const previousLesson =
    lessonIndex > 0
      ? currentModule?.lessons[lessonIndex - 1]
      : undefined;

  const previousLessonCompleted =
    !previousLesson ||
    progress?.completedLessons.includes(
      previousLesson.id
    );

  /*
   * Complete the lesson only when the student
   * presses Submit & Complete.
   */
  const handleSubmit = async () => {
    if (
      !user?._id ||
      !progress ||
      !lesson ||
      isSubmitting ||
      isCompleted
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      const nextProgress: LearningProgress = {
        ...progress,
        completedLessons:
          progress.completedLessons.includes(
            lesson.id
          )
            ? progress.completedLessons
            : [
                ...progress.completedLessons,
                lesson.id,
              ],
        currentLessonId: lesson.id,
      };

      setProgress(nextProgress);

      await saveLearningProgress(
        user._id,
        courseIdValue,
        nextProgress
      );
    } catch (error) {
      console.error(
        'Failed to save lesson completion:',
        error
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
   * Enrollment guard.
   */
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
          You need to enroll in this course before
          accessing this lesson.
        </Text>

        <TouchableOpacity
          className="bg-primary rounded-xl px-6 py-3.5 mt-6"
          onPress={() =>
            router.replace({
              pathname: '/course/[id]',
              params: {
                id: courseIdValue,
              },
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

  /*
   * Loading state.
   */
  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text className="text-muted mt-3">
          Loading lesson...
        </Text>
      </View>
    );
  }

  /*
   * Invalid lesson guard.
   */
  if (!lesson || !currentModule) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Ionicons
          name="alert-circle-outline"
          size={52}
          color={Colors.textSecondary}
        />

        <Text className="text-xl font-extrabold text-foreground mt-4">
          Lesson Not Found
        </Text>

        <TouchableOpacity
          className="bg-primary rounded-xl px-6 py-3.5 mt-6"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  /*
   * Locked lesson guard.
   *
   * This protects against manually opening a later
   * lesson URL without completing the previous lesson.
   */
  if (!previousLessonCompleted && !isCompleted) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Ionicons
          name="lock-closed-outline"
          size={56}
          color={Colors.textSecondary}
        />

        <Text className="text-xl font-extrabold text-foreground mt-4 text-center">
          Lesson Locked
        </Text>

        <Text className="text-sm text-muted text-center mt-2">
          Complete the previous lesson before
          continuing.
        </Text>

        <TouchableOpacity
          className="bg-primary rounded-xl px-6 py-3.5 mt-6"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">
            Back to Module
          </Text>
        </TouchableOpacity>
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
        <View className="mb-5">
          <Text className="text-xs font-bold text-primary uppercase">
            {currentModule.title}
          </Text>

          <Text className="text-2xl font-extrabold text-foreground mt-1">
            {lesson.title}
          </Text>

          <Text className="text-sm text-muted mt-2">
            {lesson.duration || 'Lesson'}
          </Text>
        </View>

        {/* Video Section */}
        <View className="bg-surface rounded-2xl border border-border overflow-hidden mb-5">

          <View className="h-52 bg-black items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
              <Ionicons
                name="play"
                size={30}
                color="#FFFFFF"
              />
            </View>

            <Text className="text-white font-bold mt-4">
              Video Lesson
            </Text>

            <Text className="text-gray-300 text-xs mt-1">
              {lesson.title}
            </Text>
          </View>

          <View className="p-4">
            <Text className="text-base font-bold text-foreground">
              Video lesson
            </Text>

            <Text className="text-sm text-muted mt-1">
              Watch the lesson carefully before
              completing the module.
            </Text>
          </View>
        </View>

        {/* Audio Summary */}
        <View className="bg-surface rounded-2xl border border-border p-5 mb-5">

          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-primary-light items-center justify-center">
              <Ionicons
                name="headset-outline"
                size={24}
                color={Colors.primary}
              />
            </View>

            <View className="flex-1 ml-3">
              <Text className="text-base font-bold text-foreground">
                Audio Summary
              </Text>

              <Text className="text-xs text-muted mt-1">
                Listen to a quick summary of this lesson.
              </Text>
            </View>

            <TouchableOpacity className="w-10 h-10 rounded-full bg-primary items-center justify-center">
              <Ionicons
                name="play"
                size={18}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          <View className="h-1.5 bg-border rounded-full mt-5 overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: '0%' }}
            />
          </View>
        </View>

        {/* Reading Material */}
        <View className="bg-surface rounded-2xl border border-border p-5 mb-5">

          <View className="flex-row items-center mb-3">
            <Ionicons
              name="book-outline"
              size={23}
              color={Colors.primary}
            />

            <Text className="text-base font-bold text-foreground ml-2">
              Reading Material
            </Text>
          </View>

          <Text className="text-sm text-foreground leading-6">
            {lesson.description}
          </Text>

          <Text className="text-sm text-muted leading-6 mt-3">
            This lesson introduces the important ideas
            you need to understand before moving to the
            next stage of the module. Review the material
            carefully and make sure you understand the
            concepts before submitting the lesson.
          </Text>
        </View>

        {/* Key Points */}
        <View className="bg-surface rounded-2xl border border-border p-5 mb-5">

          <View className="flex-row items-center mb-4">
            <Ionicons
              name="bulb-outline"
              size={23}
              color={Colors.primary}
            />

            <Text className="text-base font-bold text-foreground ml-2">
              Key Points
            </Text>
          </View>

          <View className="flex-row mb-3">
            <Ionicons
              name="checkmark-circle"
              size={19}
              color={Colors.success}
            />

            <Text className="flex-1 text-sm text-foreground ml-2">
              Understand the main concept covered in
              this lesson.
            </Text>
          </View>

          <View className="flex-row mb-3">
            <Ionicons
              name="checkmark-circle"
              size={19}
              color={Colors.success}
            />

            <Text className="flex-1 text-sm text-foreground ml-2">
              Connect the lesson concepts with practical
              applications.
            </Text>
          </View>

          <View className="flex-row">
            <Ionicons
              name="checkmark-circle"
              size={19}
              color={Colors.success}
            />

            <Text className="flex-1 text-sm text-foreground ml-2">
              Review the material before continuing to
              the next lesson.
            </Text>
          </View>
        </View>

        {/* Completion status */}
        {isCompleted && (
          <View className="bg-success/10 border border-success rounded-2xl p-4 mb-4">
            <View className="flex-row items-center">
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={Colors.success}
              />

              <View className="flex-1 ml-3">
                <Text className="text-sm font-bold text-success">
                  Lesson Completed
                </Text>

                <Text className="text-xs text-muted mt-1">
                  Your progress has been saved.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Submit */}
        {!isCompleted && (
          <TouchableOpacity
            className={`rounded-xl py-4 items-center ${
              isSubmitting
                ? 'bg-primary/60'
                : 'bg-primary'
            }`}
            disabled={isSubmitting}
            onPress={handleSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold text-base">
                Submit & Complete
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Back */}
        <TouchableOpacity
          className="border border-border rounded-xl py-4 items-center mt-3"
          onPress={() => router.back()}
        >
          <Text className="text-foreground font-bold">
            Back to Learning Hub
          </Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}