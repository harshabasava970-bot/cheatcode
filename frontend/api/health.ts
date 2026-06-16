import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    message: 'Interview Assistant API is running on Vercel',
    timestamp: new Date().toISOString(),
    openaiConfigured: !!process.env.OPENAI_API_KEY,
  });
}
