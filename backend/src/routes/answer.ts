import { Router, Request, Response } from 'express';
import { generateAnswer } from '../openai';
import { QuestionRequest } from '../types';

const router = Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { question } = req.body as QuestionRequest;

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    res.status(400).json({ error: 'Question is required and must be a non-empty string' });
    return;
  }

  if (question.trim().length > 2000) {
    res.status(400).json({ error: 'Question is too long (max 2000 characters)' });
    return;
  }

  try {
    const answer = await generateAnswer(question.trim());
    res.json({ success: true, question: question.trim(), answer });
  } catch (err: unknown) {
    console.error('Error generating answer:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('API key') || message.includes('401')) {
      res.status(401).json({ error: 'Invalid OpenAI API key. Please check your configuration.' });
    } else if (message.includes('429') || message.includes('rate limit')) {
      res.status(429).json({ error: 'Rate limit reached. Please wait a moment and try again.' });
    } else {
      res.status(500).json({ error: 'Failed to generate answer. Please try again.' });
    }
  }
});

export default router;
