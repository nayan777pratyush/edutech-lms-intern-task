import { GoogleGenAI } from '@google/genai';
import { Course } from '../store/courseStore';

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
] as const;

export interface CourseInsights {
  whatYouWillLearn: string[];
  bestFor: string;
  aiSummary: string;
}

const STATIC_FALLBACK: CourseInsights = {
  whatYouWillLearn: [
    'Course concepts',
    'Practical understanding',
    'Industry fundamentals',
  ],
  bestFor: 'Students interested in learning this topic',
  aiSummary: 'AI insights unavailable right now.',
};

const ai = new GoogleGenAI({
  apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
});

function buildPrompt(course: Course): string {
  return `
You are an AI learning assistant.

Analyze this course and generate student friendly insights.

Course Title:
${course.title}

Description:
${course.description}

Category:
${course.category}

Price:
${course.price}

Rating:
${course.rating}

Return ONLY valid JSON:

{
  "whatYouWillLearn": [
    "point 1",
    "point 2",
    "point 3"
  ],
  "bestFor": "Suggest which type of student should learn this course, relevant to the course content",
  "aiSummary": "2 line course summary"
}
`.trim();
}

function parseInsightsResponse(text: string | undefined): CourseInsights {
  const cleaned = text
    ?.replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  if (!cleaned) {
    throw new Error('Empty AI response');
  }

  return JSON.parse(cleaned) as CourseInsights;
}

function isRetryableModelError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (
    lower.includes('503') ||
    lower.includes('429') ||
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('overloaded') ||
    lower.includes('resource_exhausted') ||
    lower.includes('rate limit')
  ) {
    return true;
  }

  const jsonMatch = message.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return false;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      error?: { code?: number; status?: string };
    };
    const code = parsed.error?.code;
    const status = parsed.error?.status?.toUpperCase();

    return (
      code === 503 ||
      code === 429 ||
      status === 'UNAVAILABLE' ||
      status === 'RESOURCE_EXHAUSTED'
    );
  } catch {
    return false;
  }
}

async function generateWithModel(
  model: string,
  prompt: string
): Promise<CourseInsights> {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return parseInsightsResponse(response.text);
}

export async function generateCourseInsights(course: Course): Promise<CourseInsights> {
  const prompt = buildPrompt(course);
  let lastError: unknown;

  for (const model of GEMINI_MODELS) {
    try {
      const insights = await generateWithModel(model, prompt);
      return insights;
    } catch (error) {
      lastError = error;

      if (isRetryableModelError(error)) {
        console.log(`AI model ${model} unavailable, trying fallback...`, error);
        continue;
      }

      console.log(`AI Error (${model}):`, error);
      break;
    }
  }

  console.log('AI Error: all models failed.', lastError);
  return STATIC_FALLBACK;
}
