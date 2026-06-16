import OpenAI from 'openai';
import { InterviewAnswer } from './types';
import { SYSTEM_PROMPT, getCategoryDetectionPrompt, getAnswerPrompt } from './prompts';

// Lazy-initialize so the server starts even before dotenv loads
function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in .env');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

interface CategoryResult {
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

async function detectCategory(question: string): Promise<CategoryResult> {
  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: getCategoryDetectionPrompt(question) }],
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
  const client = getClient();

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: getAnswerPrompt(question, category, difficulty) },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content?.trim() || '';
  const jsonStr = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed: InterviewAnswer;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    parsed = {
      directAnswer: content,
      keyPoints: ['Please refer to the direct answer above'],
      shortVersion: content.substring(0, 200),
      detailedVersion: content,
      followUpQuestions: ['Can you elaborate?', 'Can you give an example?', 'What are the trade-offs?'],
      category,
      difficulty,
    };
  }
  return parsed;
}
