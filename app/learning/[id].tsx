import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../../store/authStore';
import {
  getCourseModules,
  LearningProgress,
  loadLearningProgress,
} from '../../store/learningStore';

export default function LearningHubScreen() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{
    id: string;
    title?: string;
  }>();

  const { user } = useAuth();

  const courseId = String(id);

  const [progress, setProgress] =
    useState<LearningProgress | null>(null);

  const [loading, setLoading] = useState(true);

  const modules = getCourseModules(courseId);

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
          courseId
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

  if (loading || !progress) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const totalLessons = modules.reduce(
    (total, module) => total + module.lessons.length,
    0
  );

  const completedLessons =
    progress.completedLessons.length;

  const courseProgress =
    totalLessons === 0
      ? 0
      : Math.round(
          (completedLessons / totalLessons) * 100
        );

  const isModuleUnlocked = (index: number) => {
    if (index === 0) return true;

    return progress.passedModules.includes(
      modules[index - 1].id
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
          Learning Hub
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>
          LEARNING HUB
        </Text>

        <Text style={styles.courseTitle}>
          {String(title || 'Course')}
        </Text>

        <Text style={styles.subtitle}>
          Continue learning from where you left off.
        </Text>

        {/* COURSE PROGRESS */}

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>
                Course Progress
              </Text>

              <Text style={styles.progressText}>
                {completedLessons} of {totalLessons}{' '}
                lessons completed
              </Text>
            </View>

            <Text style={styles.progressPercent}>
              {courseProgress}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${courseProgress}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* MODULES */}

        <Text style={styles.sectionTitle}>
          Course Modules
        </Text>

        {modules.map((module, index) => {
          const unlocked = isModuleUnlocked(index);
          const passed = progress.passedModules.includes(
            module.id
          );

          const moduleCompletedLessons =
            module.lessons.filter((lesson) =>
              progress.completedLessons.includes(
                lesson.id
              )
            ).length;

          const moduleProgress = Math.round(
            (moduleCompletedLessons /
              module.lessons.length) *
              100
          );

          return (
            <Pressable
              key={module.id}
              disabled={!unlocked}
              onPress={() =>
                router.push({
                  pathname:
                    '/learning/module/[moduleId]',
                  params: {
                    moduleId: module.id,
                    courseId,
                    title: String(title || 'Course'),
                  },
                })
              }
              style={({ pressed }) => [
                styles.moduleCard,
                !unlocked && styles.lockedCard,
                pressed &&
                  unlocked &&
                  styles.pressedCard,
              ]}
            >
              <View
                style={[
                  styles.moduleIcon,
                  !unlocked &&
                    styles.lockedModuleIcon,
                  passed &&
                    styles.completedModuleIcon,
                ]}
              >
                <Ionicons
                  name={
                    passed
                      ? 'checkmark'
                      : unlocked
                      ? 'book-outline'
                      : 'lock-closed'
                  }
                  size={25}
                  color={
                    passed
                      ? '#16a34a'
                      : unlocked
                      ? '#2563eb'
                      : '#64748b'
                  }
                />
              </View>

              <View style={styles.moduleInfo}>
                <View style={styles.moduleTopRow}>
                  <Text style={styles.moduleNumber}>
                    MODULE {index + 1}
                  </Text>

                  {passed && (
                    <Text style={styles.passedText}>
                      PASSED
                    </Text>
                  )}
                </View>

                <Text style={styles.moduleTitle}>
                  {module.title}
                </Text>

                <Text style={styles.moduleDescription}>
                  {module.description}
                </Text>

                <View style={styles.moduleProgressRow}>
                  <Text style={styles.lessonCount}>
                    {moduleCompletedLessons}/5 lessons
                  </Text>

                  <Text style={styles.modulePercent}>
                    {moduleProgress}%
                  </Text>
                </View>

                <View style={styles.moduleProgressTrack}>
                  <View
                    style={[
                      styles.moduleProgressFill,
                      {
                        width: `${moduleProgress}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <Ionicons
                name={
                  unlocked
                    ? 'chevron-forward'
                    : 'lock-closed'
                }
                size={22}
                color={
                  unlocked
                    ? '#64748b'
                    : '#94a3b8'
                }
              />
            </Pressable>
          );
        })}

        {progress.courseCompleted && (
          <View style={styles.completedCard}>
            <Ionicons
              name="trophy"
              size={36}
              color="#f59e0b"
            />

            <Text style={styles.completedTitle}>
              Course Completed 🎉
            </Text>

            <Text style={styles.completedText}>
              You successfully completed all 5
              modules and passed every quiz.
            </Text>
          </View>
        )}
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
  },

  header: {
    height: 72,
    backgroundColor: '#ffffff',
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
    fontWeight: '700',
    color: '#1e3a8a',
  },

  content: {
    padding: 22,
    paddingBottom: 50,
  },

  eyebrow: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: 8,
  },

  courseTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#172554',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },

  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 30,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  progressTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172554',
  },

  progressText: {
    marginTop: 6,
    color: '#64748b',
    fontSize: 14,
  },

  progressPercent: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2563eb',
  },

  progressTrack: {
    height: 10,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    marginTop: 18,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 10,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#172554',
    marginBottom: 14,
  },

  moduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    flexDirection: 'row',
    alignItems: 'center',
  },

  lockedCard: {
    opacity: 0.55,
    borderColor: '#e2e8f0',
  },

  pressedCard: {
    transform: [{ scale: 0.99 }],
  },

  moduleIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  lockedModuleIcon: {
    backgroundColor: '#f1f5f9',
  },

  completedModuleIcon: {
    backgroundColor: '#dcfce7',
  },

  moduleInfo: {
    flex: 1,
  },

  moduleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  moduleNumber: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2563eb',
  },

  passedText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#16a34a',
  },

  moduleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172554',
  },

  moduleDescription: {
    marginTop: 5,
    color: '#64748b',
    lineHeight: 20,
  },

  moduleProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  lessonCount: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },

  modulePercent: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '800',
  },

  moduleProgressTrack: {
    height: 7,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    marginTop: 7,
    overflow: 'hidden',
  },

  moduleProgressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 10,
  },

  completedCard: {
    marginTop: 15,
    padding: 25,
    borderRadius: 18,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    alignItems: 'center',
  },

  completedTitle: {
    marginTop: 10,
    fontSize: 21,
    fontWeight: '800',
    color: '#92400e',
  },

  completedText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#78350f',
    lineHeight: 21,
  },
});