import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { GoogleGenAI } from '@google/genai';

import { useAuth } from '../../../store/authStore';
import {
  createEmptyProgress,
  getCourseModules,
  loadLearningProgress,
  saveLearningProgress,
  type LearningProgress,
  type Module,
} from '../../../store/learningStore';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface QuizData {
  questions: QuizQuestion[];
}

const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
] as const;

const PASS_PERCENTAGE = 90;

const ai = new GoogleGenAI({
  apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
});

function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function extractJson(text: string | undefined): string {
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  let cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function validateQuiz(data: unknown): QuizData {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid quiz response.');
  }

  const quiz = data as { questions?: unknown };

  if (!Array.isArray(quiz.questions) || quiz.questions.length < 5) {
    throw new Error('Gemini did not generate enough quiz questions.');
  }

  const questions = quiz.questions
    .slice(0, 10)
    .map((item) => {
      const question = item as {
        question?: unknown;
        options?: unknown;
        answer?: unknown;
        explanation?: unknown;
      };

      if (
        typeof question.question !== 'string' ||
        !Array.isArray(question.options) ||
        question.options.length !== 4 ||
        typeof question.answer !== 'number'
      ) {
        throw new Error('Gemini returned an invalid question format.');
      }

      const options = question.options.map(String);

      if (
        question.answer < 0 ||
        question.answer >= options.length ||
        !Number.isInteger(question.answer)
      ) {
        throw new Error('Gemini returned an invalid answer index.');
      }

      return {
        question: question.question.trim(),
        options,
        answer: question.answer,
        explanation:
          typeof question.explanation === 'string'
            ? question.explanation.trim()
            : '',
      };
    });

  if (questions.length < 5) {
    throw new Error('At least 5 valid questions are required.');
  }

  return { questions };
}

function buildQuizPrompt(
  courseTitle: string,
  module: Module
): string {
  const lessons = module.lessons
    .map(
      (lesson, index) =>
        `${index + 1}. ${lesson.title}\nDescription: ${lesson.description}`
    )
    .join('\n\n');

  return `
You are an AI learning assessment generator for an educational LMS.

Generate a multiple-choice assessment for ONE course module.

Course:
${courseTitle}

Module:
${module.title}

Module Description:
${module.description}

Lessons:
${lessons}

Requirements:

1. Generate exactly 10 multiple-choice questions.
2. Each question must have exactly 4 options.
3. Questions must be based ONLY on the module and lesson information provided above.
4. Test understanding, not just memorization.
5. Use clear student-friendly language.
6. There must be exactly one correct answer.
7. "answer" must be the ZERO-BASED index of the correct option.
8. Include a short explanation for every correct answer.
9. Do not include markdown.
10. Return ONLY valid JSON.

Required format:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answer": 0,
      "explanation": "Why this answer is correct."
    }
  ]
}
`.trim();
}

function isRetryableGeminiError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error);

  const lower = message.toLowerCase();

  return (
    lower.includes('503') ||
    lower.includes('429') ||
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('resource_exhausted') ||
    lower.includes('rate limit') ||
    lower.includes('overloaded')
  );
}

async function generateQuizWithGemini(
  courseTitle: string,
  module: Module
): Promise<QuizData> {
  const prompt = buildQuizPrompt(courseTitle, module);

  let lastError: unknown;

  for (const model of GEMINI_MODELS) {
    try {
      console.log(`Generating quiz with ${model}...`);

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const json = extractJson(response.text);
      const parsed = JSON.parse(json);

      return validateQuiz(parsed);
    } catch (error) {
      lastError = error;

      console.log(`Quiz model ${model} failed:`, error);

      if (!isRetryableGeminiError(error)) {
        break;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Unable to generate quiz right now.');
}

export default function QuizScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    quizId: string;
    courseId?: string;
    title?: string;
    moduleId?: string;
  }>();

  const { user } = useAuth();

  const quizId = String(params.quizId ?? '');
  const courseId = String(params.courseId ?? '');
  const courseTitle = String(params.title ?? 'Course');

  const modules = useMemo(
    () => (courseId ? getCourseModules(courseId) : []),
    [courseId]
  );

  const module = useMemo(() => {
    if (params.moduleId) {
      return (
        modules.find(
          (item) => item.id === String(params.moduleId)
        ) ?? null
      );
    }

    return (
      modules.find((item) => item.quizId === quizId) ?? null
    );
  }, [modules, params.moduleId, quizId]);

  const [progress, setProgress] = useState<LearningProgress>(
    createEmptyProgress()
  );

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [loadingProgress, setLoadingProgress] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const moduleIndex = module
    ? modules.findIndex((item) => item.id === module.id)
    : -1;

  const allLessonsCompleted = Boolean(
    module &&
      module.lessons.length > 0 &&
      module.lessons.every((lesson) =>
        progress.completedLessons.includes(lesson.id)
      )
  );

  const alreadyPassed = Boolean(
    module && progress.passedModules.includes(module.id)
  );

  const generateQuiz = useCallback(async () => {
    if (!module) {
      setError('Module not found.');
      return;
    }

    setGenerating(true);
    setError(null);
    setQuiz(null);
    setSelectedAnswers({});
    setCurrentQuestion(0);
    setSubmitted(false);
    setScore(0);

    try {
      const generatedQuiz = await generateQuizWithGemini(
        courseTitle,
        module
      );

      setQuiz(generatedQuiz);
    } catch (error) {
      console.error('Quiz generation failed:', error);

      setError(
        'The AI quiz could not be generated right now. Please try again.'
      );
    } finally {
      setGenerating(false);
    }
  }, [courseTitle, module]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user?._id || !courseId) {
        if (active) {
          setLoadingProgress(false);
        }
        return;
      }

      try {
        const data = await loadLearningProgress(
          String(user._id),
          courseId
        );

        if (active) {
          setProgress(data);
        }
      } catch (error) {
        console.error('Failed to load learning progress:', error);

        if (active) {
          setProgress(createEmptyProgress());
        }
      } finally {
        if (active) {
          setLoadingProgress(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [courseId, user?._id]);

  useEffect(() => {
    if (
      !loadingProgress &&
      module &&
      allLessonsCompleted &&
      !alreadyPassed &&
      !quiz &&
      !generating &&
      !error
    ) {
      generateQuiz();
    }
  }, [
    loadingProgress,
    module,
    allLessonsCompleted,
    alreadyPassed,
    quiz,
    generating,
    error,
    generateQuiz,
  ]);

  function selectAnswer(optionIndex: number) {
    if (submitted) {
      return;
    }

    setSelectedAnswers((previous) => ({
      ...previous,
      [currentQuestion]: optionIndex,
    }));
  }

  function goToNextQuestion() {
    if (!quiz) {
      return;
    }

    if (selectedAnswers[currentQuestion] === undefined) {
      showMessage(
        'Answer Required',
        'Please select an answer before continuing.'
      );
      return;
    }

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((previous) => previous + 1);
    }
  }

  function goToPreviousQuestion() {
    if (currentQuestion > 0) {
      setCurrentQuestion((previous) => previous - 1);
    }
  }

  async function submitQuiz() {
    if (!quiz || !user?._id || !module) {
      return;
    }

    const unanswered = quiz.questions.findIndex(
      (_, index) => selectedAnswers[index] === undefined
    );

    if (unanswered !== -1) {
      setCurrentQuestion(unanswered);

      showMessage(
        'Incomplete Quiz',
        'Please answer all questions before submitting.'
      );

      return;
    }

    let correct = 0;

    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.answer) {
        correct += 1;
      }
    });

    const percentage = Math.round(
      (correct / quiz.questions.length) * 100
    );

    const passed = percentage >= PASS_PERCENTAGE;

    const nextPassedModules = passed
      ? Array.from(
          new Set([...progress.passedModules, module.id])
        )
      : progress.passedModules;

    const courseCompleted =
      passed &&
      moduleIndex === modules.length - 1 &&
      nextPassedModules.length === modules.length;

    const updatedProgress: LearningProgress = {
      ...progress,
      quizScores: {
        ...progress.quizScores,
        [quizId]: percentage,
      },
      passedModules: nextPassedModules,
      courseCompleted,
    };

    await saveLearningProgress(
      String(user._id),
      courseId,
      updatedProgress
    );

    setProgress(updatedProgress);
    setScore(percentage);
    setSubmitted(true);
  }

  function retryQuiz() {
    setQuiz(null);
    setSelectedAnswers({});
    setCurrentQuestion(0);
    setSubmitted(false);
    setScore(0);
    setError(null);

    generateQuiz();
  }

  function continueAfterPassing() {
    if (!module) {
      router.back();
      return;
    }

    if (progress.courseCompleted) {
      router.replace({
        pathname: '/learning/[id]',
        params: {
          id: courseId,
          title: courseTitle,
        },
      });
      return;
    }

    const nextModule = modules[moduleIndex + 1];

    if (nextModule) {
      router.replace({
        pathname: '/learning/module/[moduleId]',
        params: {
          moduleId: nextModule.id,
          courseId,
          title: courseTitle,
        },
      });
      return;
    }

    router.back();
  }

  if (loadingProgress) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>
          Loading assessment...
        </Text>
      </View>
    );
  }

  if (!module) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Quiz unavailable</Text>
        <Text style={styles.errorText}>
          We could not find the module associated with this quiz.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (!allLessonsCompleted && !alreadyPassed) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Module Quiz',
          }}
        />

        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.container}
        >
          <View style={styles.lockIcon}>
            <Text style={styles.lockEmoji}>🔒</Text>
          </View>

          <Text style={styles.eyebrow}>MODULE ASSESSMENT</Text>

          <Text style={styles.title}>Module Quiz</Text>

          <Text style={styles.subtitle}>
            Complete all 5 lessons in this module before
            attempting the AI-generated assessment.
          </Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              Lesson Progress
            </Text>

            <Text style={styles.infoValue}>
              {
                module.lessons.filter((lesson) =>
                  progress.completedLessons.includes(lesson.id)
                ).length
              }{' '}
              / {module.lessons.length} completed
            </Text>
          </View>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>
              Back to Module
            </Text>
          </Pressable>
        </ScrollView>
      </>
    );
  }

  if (alreadyPassed) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Module Complete',
          }}
        />

        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.container}
        >
          <View style={styles.successCircle}>
            <Text style={styles.successIcon}>✓</Text>
          </View>

          <Text style={styles.eyebrow}>ASSESSMENT PASSED</Text>

          <Text style={styles.title}>
            Module Complete
          </Text>

          <Text style={styles.subtitle}>
            You have already passed this module assessment.
          </Text>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>
              Your Score
            </Text>

            <Text style={styles.scoreValue}>
              {progress.quizScores[quizId] ?? 100}%
            </Text>

            <Text style={styles.passText}>
              ✓ Passed with at least 90%
            </Text>
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={continueAfterPassing}
          >
            <Text style={styles.primaryButtonText}>
              {progress.courseCompleted
                ? 'View Course'
                : 'Continue to Next Module'}
            </Text>
          </Pressable>
        </ScrollView>
      </>
    );
  }

  if (generating) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'AI Module Quiz',
          }}
        />

        <View style={styles.center}>
          <View style={styles.aiCircle}>
            <Text style={styles.aiEmoji}>✨</Text>
          </View>

          <Text style={styles.loadingTitle}>
            Generating Your Quiz
          </Text>

          <Text style={styles.loadingText}>
            Gemini is creating questions based on{' '}
            {module.title}.
          </Text>

          <ActivityIndicator
            size="large"
            color="#2563EB"
            style={styles.spinner}
          />
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'AI Module Quiz',
          }}
        />

        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.container}
        >
          <View style={styles.errorCircle}>
            <Text style={styles.errorEmoji}>!</Text>
          </View>

          <Text style={styles.title}>
            Quiz Generation Failed
          </Text>

          <Text style={styles.subtitle}>
            {error}
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={generateQuiz}
          >
            <Text style={styles.primaryButtonText}>
              Try Again
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>
              Back to Module
            </Text>
          </Pressable>
        </ScrollView>
      </>
    );
  }

  if (!quiz) {
    return null;
  }

  if (submitted) {
    const passed = score >= PASS_PERCENTAGE;

    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: passed ? 'Quiz Passed' : 'Quiz Result',
          }}
        />

        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.container}
        >
          <View
            style={[
              styles.resultCircle,
              passed
                ? styles.resultSuccess
                : styles.resultRetry,
            ]}
          >
            <Text style={styles.resultIcon}>
              {passed ? '✓' : '!'}
            </Text>
          </View>

          <Text style={styles.eyebrow}>
            MODULE ASSESSMENT
          </Text>

          <Text style={styles.title}>
            {passed ? 'Assessment Passed!' : 'Try Again'}
          </Text>

          <Text style={styles.subtitle}>
            {passed
              ? 'Great work. You have successfully completed this module.'
              : `You need at least ${PASS_PERCENTAGE}% to unlock the next module.`}
          </Text>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>
              Your Score
            </Text>

            <Text
              style={[
                styles.scoreValue,
                passed
                  ? styles.scorePassed
                  : styles.scoreFailed,
              ]}
            >
              {score}%
            </Text>

            <Text style={styles.scoreDetails}>
              {Math.round(
                (score / 100) * quiz.questions.length
              )}{' '}
              / {quiz.questions.length} correct
            </Text>
          </View>

          {passed ? (
            <>
              <View style={styles.passCard}>
                <Text style={styles.passCardTitle}>
                  ✓ Module Unlocked
                </Text>

                <Text style={styles.passCardText}>
                  Your progress has been saved. The next
                  module is now available.
                </Text>
              </View>

              <Pressable
                style={styles.primaryButton}
                onPress={continueAfterPassing}
              >
                <Text style={styles.primaryButtonText}>
                  {progress.courseCompleted
                    ? 'Complete Course'
                    : 'Continue to Next Module'}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.retryCard}>
                <Text style={styles.retryCardTitle}>
                  90% Required
                </Text>

                <Text style={styles.retryCardText}>
                  Review the lessons and try the AI-generated
                  assessment again.
                </Text>
              </View>

              <Pressable
                style={styles.primaryButton}
                onPress={retryQuiz}
              >
                <Text style={styles.primaryButtonText}>
                  Retry Quiz
                </Text>
              </Pressable>
            </>
          )}

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>
              Back to Module
            </Text>
          </Pressable>
        </ScrollView>
      </>
    );
  }

  const question = quiz.questions[currentQuestion];
  const selected = selectedAnswers[currentQuestion];
  const isLastQuestion =
    currentQuestion === quiz.questions.length - 1;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'AI Module Quiz',
        }}
      />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
      >
        <View style={styles.quizHeader}>
          <View>
            <Text style={styles.eyebrow}>
              AI GENERATED ASSESSMENT
            </Text>

            <Text style={styles.quizTitle}>
              {module.title}
            </Text>
          </View>

          <View style={styles.questionBadge}>
            <Text style={styles.questionBadgeText}>
              {currentQuestion + 1}/{quiz.questions.length}
            </Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${
                  ((currentQuestion + 1) /
                    quiz.questions.length) *
                  100
                }%`,
              },
            ]}
          />
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.questionNumber}>
            QUESTION {currentQuestion + 1}
          </Text>

          <Text style={styles.questionText}>
            {question.question}
          </Text>

          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => {
              const selectedOption = selected === index;

              return (
                <Pressable
                  key={`${index}-${option}`}
                  onPress={() => selectAnswer(index)}
                  style={[
                    styles.option,
                    selectedOption &&
                      styles.optionSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.optionLetter,
                      selectedOption &&
                        styles.optionLetterSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLetterText,
                        selectedOption &&
                          styles.optionLetterTextSelected,
                      ]}
                    >
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.optionText,
                      selectedOption &&
                        styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.navigationRow}>
          <Pressable
            style={[
              styles.navButton,
              currentQuestion === 0 &&
                styles.navButtonDisabled,
            ]}
            disabled={currentQuestion === 0}
            onPress={goToPreviousQuestion}
          >
            <Text style={styles.navButtonText}>
              Previous
            </Text>
          </Pressable>

          {!isLastQuestion ? (
            <Pressable
              style={styles.navButtonPrimary}
              onPress={goToNextQuestion}
            >
              <Text style={styles.navButtonPrimaryText}>
                Next
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.navButtonPrimary}
              onPress={submitQuiz}
            >
              <Text style={styles.navButtonPrimaryText}>
                Submit Quiz
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.quizNote}>
          <Text style={styles.quizNoteText}>
            You need at least 90% to pass this assessment.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },

  container: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
    padding: 24,
    paddingBottom: 60,
  },

  center: {
    flex: 1,
    minHeight: 500,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#F7F9FC',
  },

  loadingTitle: {
    marginTop: 20,
    fontSize: 25,
    fontWeight: '800',
    color: '#172554',
    textAlign: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 500,
  },

  spinner: {
    marginTop: 24,
  },

  aiCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },

  aiEmoji: {
    fontSize: 38,
  },

  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    marginBottom: 24,
  },

  lockEmoji: {
    fontSize: 34,
  },

  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    marginBottom: 24,
  },

  successIcon: {
    fontSize: 42,
    fontWeight: '900',
    color: '#16A34A',
  },

  errorCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    marginBottom: 24,
  },

  errorEmoji: {
    fontSize: 42,
    fontWeight: '900',
    color: '#DC2626',
  },

  resultCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  resultSuccess: {
    backgroundColor: '#DCFCE7',
  },

  resultRetry: {
    backgroundColor: '#FEF3C7',
  },

  resultIcon: {
    fontSize: 48,
    fontWeight: '900',
    color: '#16A34A',
  },

  eyebrow: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  title: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '900',
    color: '#172554',
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 17,
    lineHeight: 27,
    color: '#64748B',
    marginBottom: 28,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    marginBottom: 24,
  },

  infoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#172554',
  },

  infoValue: {
    marginTop: 8,
    fontSize: 25,
    fontWeight: '800',
    color: '#2563EB',
  },

  primaryButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  secondaryButton: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 12,
  },

  secondaryButtonText: {
    color: '#172554',
    fontSize: 16,
    fontWeight: '800',
  },

  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 22,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },

  scoreLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },

  scoreValue: {
    marginTop: 8,
    fontSize: 58,
    lineHeight: 68,
    fontWeight: '900',
  },

  scorePassed: {
    color: '#16A34A',
  },

  scoreFailed: {
    color: '#DC2626',
  },

  scoreDetails: {
    marginTop: 4,
    fontSize: 16,
    color: '#64748B',
  },

  passText: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#16A34A',
  },

  passCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 18,
    padding: 20,
    marginBottom: 8,
  },

  passCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#15803D',
  },

  passCardText: {
    marginTop: 7,
    fontSize: 15,
    lineHeight: 23,
    color: '#166534',
  },

  retryCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 20,
    marginBottom: 8,
  },

  retryCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#B45309',
  },

  retryCardText: {
    marginTop: 7,
    fontSize: 15,
    lineHeight: 23,
    color: '#92400E',
  },

  errorTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#172554',
    textAlign: 'center',
  },

  errorText: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 500,
  },

  quizHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 20,
  },

  quizTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: '#172554',
  },

  questionBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#EEF2FF',
  },

  questionBadgeText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '800',
  },

  progressTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 24,
  },

  progressFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },

  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 26,
  },

  questionNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2563EB',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  questionText: {
    fontSize: 23,
    lineHeight: 32,
    fontWeight: '800',
    color: '#172554',
    marginBottom: 26,
  },

  optionsContainer: {
    gap: 12,
  },

  option: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    padding: 12,
  },

  optionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },

  optionLetter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    marginRight: 14,
  },

  optionLetterSelected: {
    backgroundColor: '#2563EB',
  },

  optionLetterText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
  },

  optionLetterTextSelected: {
    color: '#FFFFFF',
  },

  optionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 23,
    color: '#334155',
  },

  optionTextSelected: {
    color: '#1D4ED8',
    fontWeight: '700',
  },

  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },

  navButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  navButtonDisabled: {
    opacity: 0.4,
  },

  navButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },

  navButtonPrimary: {
    flex: 1,
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  navButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  quizNote: {
    marginTop: 18,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
  },

  quizNoteText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#3730A3',
    fontWeight: '600',
  },
});