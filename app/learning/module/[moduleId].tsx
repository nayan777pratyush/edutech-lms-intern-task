import { Ionicons } from '@expo/vector-icons';
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../../../store/authStore';
import {
  getCourseModules,
  LearningProgress,
  loadLearningProgress,
} from '../../../store/learningStore';

export default function ModuleScreen() {
  const router = useRouter();

  const {
    moduleId,
    courseId,
    title,
  } = useLocalSearchParams<{
    moduleId: string;
    courseId: string;
    title?: string;
  }>();

  const { user } = useAuth();

  const modules = getCourseModules(
    String(courseId)
  );

  const module = modules.find(
    (item) => item.id === String(moduleId)
  );

  const [progress, setProgress] =
    useState<LearningProgress | null>(null);

  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        if (!user?._id) {
          setLoading(false);
          return;
        }

        const data = await loadLearningProgress(
          String(user._id),
          String(courseId)
        );

        if (active) {
          setProgress(data);
          setLoading(false);
        }
      }

      load();

      return () => {
        active = false;
      };
    }, [user?._id, courseId])
  );

  if (loading || !progress || !module) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const moduleIndex = modules.findIndex(
    (item) => item.id === module.id
  );

  const moduleUnlocked =
    moduleIndex === 0 ||
    progress.passedModules.includes(
      modules[moduleIndex - 1].id
    );

  if (!moduleUnlocked) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="lock-closed"
          size={54}
          color="#64748b"
        />

        <Text style={styles.lockedTitle}>
          Module Locked
        </Text>

        <Text style={styles.lockedText}>
          Pass the previous module quiz before
          continuing.
        </Text>

        <Pressable
          onPress={() => router.back()}
          style={styles.primaryButton}
        >
          <Text style={styles.buttonText}>
            Back to Learning Hub
          </Text>
        </Pressable>
      </View>
    );
  }

  const completedLessons =
    module.lessons.filter((lesson) =>
      progress.completedLessons.includes(
        lesson.id
      )
    ).length;

  const moduleProgress = Math.round(
    (completedLessons / module.lessons.length) *
      100
  );

  const quizUnlocked =
    completedLessons === module.lessons.length;

  const quizPassed =
    progress.quizScores[module.quizId] !== undefined &&
    progress.quizScores[module.quizId] >= 90;

  const isLessonUnlocked = (index: number) => {
    if (index === 0) return true;

    return progress.completedLessons.includes(
      module.lessons[index - 1].id
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#2563eb"
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Module {moduleIndex + 1}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>
          MODULE {moduleIndex + 1}
        </Text>

        <Text style={styles.title}>
          {module.title}
        </Text>

        <Text style={styles.description}>
          {module.description}
        </Text>

        {/* MODULE PROGRESS */}

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>
                Module Progress
              </Text>

              <Text style={styles.progressText}>
                {completedLessons} of 5 lessons
                completed
              </Text>
            </View>

            <Text style={styles.progressPercent}>
              {moduleProgress}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${moduleProgress}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Lessons
        </Text>

        {module.lessons.map((lesson, index) => {
          const completed =
            progress.completedLessons.includes(
              lesson.id
            );

          const unlocked =
            isLessonUnlocked(index);

          return (
            <Pressable
              key={lesson.id}
              disabled={!unlocked}
              onPress={() =>
                router.push({
                  pathname:
                    '/learning/lesson/[lessonId]',
                  params: {
                    lessonId: lesson.id,
                    moduleId: module.id,
                    courseId: String(courseId),
                    title: String(title || 'Course'),
                  },
                })
              }
              style={({ pressed }) => [
                styles.lessonCard,
                !unlocked && styles.lockedCard,
                pressed &&
                  unlocked &&
                  styles.pressedCard,
              ]}
            >
              <View
                style={[
                  styles.lessonIcon,
                  completed &&
                    styles.completedIcon,
                  !unlocked &&
                    styles.lockedIcon,
                ]}
              >
                <Ionicons
                  name={
                    completed
                      ? 'checkmark'
                      : unlocked
                      ? lesson.type === 'video'
                        ? 'play'
                        : 'book-outline'
                      : 'lock-closed'
                  }
                  size={22}
                  color={
                    completed
                      ? '#16a34a'
                      : unlocked
                      ? '#2563eb'
                      : '#64748b'
                  }
                />
              </View>

              <View style={styles.lessonInfo}>
                <Text style={styles.lessonNumber}>
                  LESSON {index + 1}
                </Text>

                <Text style={styles.lessonTitle}>
                  {lesson.title}
                </Text>

                <Text style={styles.lessonDescription}>
                  {lesson.description}
                </Text>

                <Text style={styles.duration}>
                  {lesson.duration}
                </Text>
              </View>

              <Ionicons
                name={
                  unlocked
                    ? 'chevron-forward'
                    : 'lock-closed'
                }
                size={21}
                color={
                  unlocked
                    ? '#64748b'
                    : '#94a3b8'
                }
              />
            </Pressable>
          );
        })}

        {/* REAL QUIZ CARD */}

        <Text style={styles.sectionTitle}>
          Module Assessment
        </Text>

        <Pressable
          disabled={!quizUnlocked}
          onPress={() =>
            router.push({
              pathname:
                '/learning/quiz/[quizId]',
              params: {
                quizId: module.quizId,
                moduleId: module.id,
                courseId: String(courseId),
                title: String(title || 'Course'),
              },
            })
          }
          style={[
            styles.quizCard,
            !quizUnlocked &&
              styles.quizLockedCard,
            quizPassed &&
              styles.quizPassedCard,
          ]}
        >
          <View
            style={[
              styles.quizIcon,
              quizPassed &&
                styles.quizPassedIcon,
            ]}
          >
            <Ionicons
              name={
                quizPassed
                  ? 'checkmark-circle'
                  : quizUnlocked
                  ? 'school'
                  : 'lock-closed'
              }
              size={28}
              color={
                quizPassed
                  ? '#16a34a'
                  : quizUnlocked
                  ? '#7c3aed'
                  : '#64748b'
              }
            />
          </View>

          <View style={styles.quizInfo}>
            <Text style={styles.quizLabel}>
              AI GENERATED QUIZ
            </Text>

            <Text style={styles.quizTitle}>
              {quizPassed
                ? 'Quiz Passed'
                : 'Module Quiz'}
            </Text>

            <Text style={styles.quizDescription}>
              {!quizUnlocked
                ? 'Complete all 5 lessons to unlock the quiz.'
                : quizPassed
                ? `Passed with ${
                    progress.quizScores[
                      module.quizId
                    ]
                  }%.`
                : 'Test your understanding with an AI-generated assessment.'}
            </Text>
          </View>

          <Ionicons
            name={
              quizUnlocked
                ? 'chevron-forward'
                : 'lock-closed'
            }
            size={22}
            color="#64748b"
          />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  header: {
    height: 72,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  backButton: {
    marginRight: 14,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e3a8a',
  },

  content: {
    padding: 22,
    paddingBottom: 50,
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    color: '#2563eb',
    marginBottom: 8,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#172554',
  },

  description: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 16,
    lineHeight: 23,
  },

  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginTop: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  progressTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172554',
  },

  progressText: {
    marginTop: 5,
    color: '#64748b',
  },

  progressPercent: {
    fontSize: 26,
    fontWeight: '900',
    color: '#2563eb',
  },

  progressTrack: {
    height: 9,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    marginTop: 17,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 10,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#172554',
    marginBottom: 14,
  },

  lessonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  lockedCard: {
    opacity: 0.5,
    borderColor: '#e2e8f0',
  },

  pressedCard: {
    transform: [{ scale: 0.99 }],
  },

  lessonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  completedIcon: {
    backgroundColor: '#dcfce7',
  },

  lockedIcon: {
    backgroundColor: '#f1f5f9',
  },

  lessonInfo: {
    flex: 1,
  },

  lessonNumber: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2563eb',
  },

  lessonTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#172554',
    marginTop: 3,
  },

  lessonDescription: {
    color: '#64748b',
    marginTop: 4,
    lineHeight: 19,
  },

  duration: {
    color: '#64748b',
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },

  quizCard: {
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  quizLockedCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    opacity: 0.6,
  },

  quizPassedCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },

  quizIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  quizPassedIcon: {
    backgroundColor: '#dcfce7',
  },

  quizInfo: {
    flex: 1,
  },

  quizLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#7c3aed',
  },

  quizTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#172554',
    marginTop: 3,
  },

  quizDescription: {
    color: '#64748b',
    marginTop: 5,
    lineHeight: 19,
  },

  lockedTitle: {
    marginTop: 18,
    fontSize: 24,
    fontWeight: '900',
    color: '#172554',
  },

  lockedText: {
    marginTop: 8,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },

  primaryButton: {
    marginTop: 25,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },
});