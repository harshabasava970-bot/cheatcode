import OpenAI from 'openai';
import { InterviewAnswer } from './types';
import { SYSTEM_PROMPT, getCategoryDetectionPrompt, getAnswerPrompt } from './prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CategoryResult {
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

async function detectCategory(question: string): Promise<CategoryResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: getCategoryDetectionPrompt(question),
        },
      ],
      temperature: 0.1,
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content?.trim() || '';
    const parsed = JSON.parse(content);
    return {
      category: parsed.category || 'General',
      difficulty: parsed.difficulty || 'Medium',
    };
  } catch {
    return { category: 'General', difficulty: 'Medium' };
  }
}

export async function generateAnswer(question: string): Promise<InterviewAnswer> {
  const { category, difficulty } = await detectCategory(question);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: getAnswerPrompt(question, category, difficulty),
      },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content?.trim() || '';

  // Strip markdown code fences if present
  const jsonStr = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed: InterviewAnswer;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // Fallback if JSON parsing fails
    parsed = {
      directAnswer: content,
      keyPoints: ['Please refer to the direct answer above'],
      shortVersion: content.substring(0, 200),
      detailedVersion: content,
      followUpQuestions: ['Can you elaborate on this topic?', 'Can you give an example?', 'What are the trade-offs?'],
      category,
      difficulty,
    };
  }

  return parsed;
}
