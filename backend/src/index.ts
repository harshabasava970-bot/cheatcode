import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import answerRouter from './routes/answer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/answer', answerRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Interview Assistant API is running',
    timestamp: new Date().toISOString(),
    openaiConfigured: !!process.env.OPENAI_API_KEY,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Interview Assistant API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured'}\n`);
});

export default app;
