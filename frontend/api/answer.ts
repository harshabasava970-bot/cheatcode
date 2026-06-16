import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';

interface InterviewAnswer {
  directAnswer: string;
  keyPoints: string[];
  shortVersion: string;
  detailedVersion: string;
  followUpQuestions: string[];
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const SYSTEM_PROMPT = `You are a senior technical interviewer and career coach helping B.Tech students and software engineers ace interviews across ALL domains.

Guidelines:
- Factually correct, technically accurate answers
- Simple clear language, include code examples where helpful
- Interview-optimized — not textbook dumps
- Mention time/space complexity for DSA
- Include code snippets for coding questions

Domains: Python, JavaScript, TypeScript, Java, C/C++, SQL, HTML/CSS, React, Vue, Angular, Next.js, Node.js, Express, Django, FastAPI, Spring Boot, REST API, GraphQL, WebSockets, Auth/JWT, MySQL, PostgreSQL, MongoDB, Redis, Docker, Kubernetes, AWS, Git, System Design, DSA, OOP, SOLID, Design Patterns, OS, CN, DBMS, Security, AI/ML, Full Stack, HR/Behavioral`;

function buildPrompt(question: string): string {
  return `Analyze this interview question and respond with ONLY valid JSON (no markdown, no code fences, no extra text):

Question: "${question}"

Respond with exactly this JSON:
{
  "category": "<DSA|Python|JavaScript|TypeScript|Java|C/C++|SQL|React|Vue|Angular|Next.js|HTML/CSS|Node.js|Django|FastAPI|Spring Boot|REST API|GraphQL|MongoDB|PostgreSQL|Redis|Docker|Kubernetes|AWS|Git|System Design|OOP|Design Patterns|OS|CN|DBMS|Security|AI/ML|Full Stack|Testing|HR|General>",
  "difficulty": "<Easy|Medium|Hard>",
  "directAnswer": "2-3 sentence core answer",
  "keyPoints": ["point1", "point2", "point3", "point4", "point5"],
  "shortVersion": "Natural 30-second spoken answer (80-100 words, conversational)",
  "detailedVersion": "Comprehensive 1-2 minute answer with code snippet where relevant (200-300 words)",
  "followUpQuestions": ["follow-up 1", "follow-up 2", "follow-up 3"]
}`;
}

function cleanJson(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { question } = req.body as { question?: string };
  if (!question?.trim()) { res.status(400).json({ error: 'Question is required' }); return; }

  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(question.trim()) },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const raw = cleanJson(completion.choices[0]?.message?.content ?? '');
    const parsed = JSON.parse(raw) as InterviewAnswer;
    res.status(200).json({ success: true, question: question.trim(), answer: parsed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Groq error:', msg);
    res.status(500).json({ error: 'Failed to generate answer. Please try again.' });
  }
}
