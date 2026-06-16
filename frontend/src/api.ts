import { InterviewAnswer } from './types';

const API_BASE = '/api';

export async function fetchAnswer(question: string): Promise<InterviewAnswer> {
  const response = await fetch(`${API_BASE}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Server error: ${response.status}`);
  }

  const data = await response.json();
  return data.answer as InterviewAnswer;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
