import Groq from 'groq-sdk';
import { InterviewAnswer } from './types';

function getClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in .env');
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const SYSTEM_PROMPT = `You are a senior technical interviewer and career coach helping B.Tech students and software engineers ace interviews across ALL domains.

Guidelines:
- Factually correct, technically accurate answers
- Simple clear language, include code examples where helpful  
- Interview-optimized — not textbook dumps
- Mention time/space complexity for DSA
- Include code snippets for coding questions

Domains: Python, JavaScript, TypeScript, Java, C/C++, Go, SQL, HTML/CSS, React, Vue, Angular, Next.js, Node.js, Express, Django, FastAPI, Spring Boot, REST API, GraphQL, WebSockets, Auth/JWT/OAuth, MySQL, PostgreSQL, MongoDB, Redis, Docker, Kubernetes, AWS, Git, CI/CD, System Design, Microservices, DSA, OOP, SOLID, Design Patterns, OS, Computer Networks, DBMS, Security, AI/ML, Full Stack, HR/Behavioral`;

function buildPrompt(question: string): string {
  return `Analyze this interview question and respond with ONLY valid JSON (no markdown, no code fences, no extra text):

Question: "${question}"

Respond with exactly this JSON structure:
{
  "category": "<one of: DSA, Python, JavaScript, TypeScript, Java, C/C++, SQL, React, Vue, Angular, Next.js, HTML/CSS, Node.js, Django, FastAPI, Spring Boot, REST API, GraphQL, MongoDB, PostgreSQL, Redis, Docker, Kubernetes, AWS, Git, System Design, OOP, Design Patterns, OS, CN, DBMS, Security, AI/ML, Full Stack, Testing, HR, General>",
  "difficulty": "<Easy|Medium|Hard>",
  "directAnswer": "2-3 sentence core answer",
  "keyPoints": ["point1", "point2", "point3", "point4", "point5"],
  "shortVersion": "Natural 30-second spoken answer (80-100 words, conversational, include brief example)",
  "detailedVersion": "Comprehensive 1-2 minute answer with code snippet where relevant (200-300 words)",
  "followUpQuestions": ["follow-up 1", "follow-up 2", "follow-up 3"]
}`;
}

function cleanJson(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

export async function generateAnswer(question: string): Promise<InterviewAnswer> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildPrompt(question) },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const raw = cleanJson(completion.choices[0]?.message?.content ?? '');

  try {
    const parsed = JSON.parse(raw);
    return {
      directAnswer: parsed.directAnswer ?? raw,
      keyPoints: parsed.keyPoints ?? [],
      shortVersion: parsed.shortVersion ?? '',
      detailedVersion: parsed.detailedVersion ?? raw,
      followUpQuestions: parsed.followUpQuestions ?? [],
      category: parsed.category ?? 'General',
      difficulty: parsed.difficulty ?? 'Medium',
    };
  } catch {
    return {
      directAnswer: raw,
      keyPoints: ['Refer to the direct answer above'],
      shortVersion: raw.slice(0, 200),
      detailedVersion: raw,
      followUpQuestions: ['Can you elaborate?', 'Can you give an example?', 'What are the trade-offs?'],
      category: 'General',
      difficulty: 'Medium',
    };
  }
}
