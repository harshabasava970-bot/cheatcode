export interface InterviewAnswer {
  directAnswer: string;
  keyPoints: string[];
  shortVersion: string;
  detailedVersion: string;
  followUpQuestions: string[];
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface HistoryEntry {
  id: string;
  question: string;
  answer: InterviewAnswer;
  timestamp: string;
  strength: 'weak' | 'strong' | 'neutral';
}

export interface RevisionNote {
  id: string;
  question: string;
  keyPoints: string[];
  shortVersion: string;
  category: string;
  createdAt: string;
}

export type SessionStatus = 'idle' | 'listening' | 'processing' | 'answered';

export type AnswerTab = 'direct' | 'keypoints' | 'short' | 'detailed' | 'followup';
