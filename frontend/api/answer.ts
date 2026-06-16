import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// ── Types ────────────────────────────────────────────────────────────────────

interface InterviewAnswer {
  directAnswer: string;
  keyPoints: string[];
  shortVersion: string;
  detailedVersion: string;
  followUpQuestions: string[];
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

// ── OpenAI client (initialised per request so env var is always fresh) ────────

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ── Prompts ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior technical interviewer and career coach specializing in helping B.Tech students and software engineering candidates ace interviews across all domains of technology.

Your responsibilities:
- Provide factually correct, technically accurate answers
- Use simple, clear language suitable for freshers and B.Tech students
- Include relevant code examples, analogies, and real-world scenarios
- Optimize answers for job interviews — concise, memorable, impactful

FULL COVERAGE DOMAINS:
- Programming Languages: Python, JavaScript, TypeScript, Java, C/C++, Go, Rust, SQL
- Frontend: HTML/CSS, React, Vue, Angular, Next.js, Web Performance, Testing
- Backend: Node.js, Express, Django, FastAPI, Spring Boot, REST APIs, GraphQL, WebSockets
- Databases: SQL (MySQL, PostgreSQL), NoSQL (MongoDB, Redis), ORM/ODM, Database Design
- Full Stack: MERN, MEAN, T3 stack, API integration
- DevOps & Cloud: Docker, Kubernetes, AWS, CI/CD, Git
- System Design: Scalability, Load Balancing, Caching, Microservices, Message Queues
- CS Fundamentals: DSA, OOP, SOLID, Design Patterns, OS, Computer Networks, DBMS
- Security: Authentication, JWT, OAuth, XSS, CSRF, SQL Injection
- AI/ML basics, HR & Behavioral questions

Answer Format Rules:
1. Direct Answer: 2-3 sentences giving the core answer immediately
2. Key Points: 3-5 bullet points covering the most important aspects
3. Short Interview Version (30 seconds): Natural, conversational, human-like
4. Detailed Version (1-2 minutes): Comprehensive with code examples where helpful
5. Follow-up Questions: 3 likely follow-up questions

Guidelines:
- Include small code snippets for coding questions
- Mention time/space complexity for algorithm questions
- For system design, mention scalability trade-offs
- Keep answers interview-optimized, not textbook dumps`;

function getCategoryPrompt(question: string): string {
  return `Analyze this interview question and return ONLY a JSON object:
{"category": "<one of: DSA, Python, JavaScript, TypeScript, Java, C/C++, SQL, React, Vue, Angular, Next.js, HTML/CSS, Node.js, Django, FastAPI, Spring Boot, REST API, GraphQL, MongoDB, PostgreSQL, Redis, Docker, Kubernetes, AWS, Git, System Design, OOP, Design Patterns, OS, CN, DBMS, Security, AI/ML, Full Stack, Testing, HR, General>", "difficulty": "<Easy|Medium|Hard>"}

Question: "${question}"`;
}

function getAnswerPrompt(question: string, category: string, difficulty: string): string {
  return `Interview Question: "${question}"
Category: ${category} | Difficulty: ${difficulty}

Return ONLY valid JSON (no markdown, no code fences):
{
  "directAnswer": "2-3 sentence core answer",
  "keyPoints": ["point1", "point2", "point3", "point4", "point5"],
  "shortVersion": "Natural 30-second spoken answer (80-100 words, conversational tone, include a brief example if helpful)",
  "detailedVersion": "Comprehensive 1-2 minute answer with code snippet or example (200-300 words)",
  "followUpQuestions": ["follow-up 1", "follow-up 2", "follow-up 3"],
  "category": "${category}",
  "difficulty": "${difficulty}"
}`;
}

// ── Core logic ────────────────────────────────────────────────────────────────

async function detectCategory(question: string): Promise<{ category: string; difficulty: 'Easy' | 'Medium' | 'Hard' }> {
  const client = getClient();
  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: getCategoryPrompt(question) }],
      temperature: 0.1,
      max_tokens: 80,
    });
    const raw = res.choices[0]?.message?.content?.trim() ?? '{}';
    const parsed = JSON.parse(raw);
    return {
      category: parsed.category ?? 'General',
      difficulty: parsed.difficulty ?? 'Medium',
    };
  } catch {
    return { category: 'General', difficulty: 'Medium' };
  }
}

async function generateAnswer(question: string): Promise<InterviewAnswer> {
  const { category, difficulty } = await detectCategory(question);
  const client = getClient();

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: getAnswerPrompt(question, category, difficulty) },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const raw = res.choices[0]?.message?.content?.trim() ?? '';
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    return JSON.parse(jsonStr) as InterviewAnswer;
  } catch {
    return {
      directAnswer: raw,
      keyPoints: ['Refer to the direct answer above'],
      shortVersion: raw.slice(0, 200),
      detailedVersion: raw,
      followUpQuestions: ['Can you elaborate?', 'Can you give an example?', 'What are the trade-offs?'],
      category,
      difficulty,
    };
  }
}

// ── Vercel handler ────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { question } = req.body as { question?: string };

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    res.status(400).json({ error: 'Question is required' });
    return;
  }

  if (question.trim().length > 2000) {
    res.status(400).json({ error: 'Question too long (max 2000 characters)' });
    return;
  }

  try {
    const answer = await generateAnswer(question.trim());
    res.status(200).json({ success: true, question: question.trim(), answer });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Answer generation error:', message);

    if (message.includes('401') || message.includes('API key')) {
      res.status(401).json({ error: 'Invalid OpenAI API key.' });
    } else if (message.includes('429') || message.includes('rate limit')) {
      res.status(429).json({ error: 'Rate limit hit. Please wait and try again.' });
    } else {
      res.status(500).json({ error: 'Failed to generate answer. Please try again.' });
    }
  }
}
