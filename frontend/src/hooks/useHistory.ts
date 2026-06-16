import { useState, useCallback, useEffect } from 'react';
import { HistoryEntry, InterviewAnswer, RevisionNote } from '../types';

const HISTORY_KEY = 'interview_history';
const NOTES_KEY = 'revision_notes';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [revisionNotes, setRevisionNotes] = useState<RevisionNote[]>(() => {
    try {
      const stored = localStorage.getItem(NOTES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Storage quota exceeded — trim oldest entries
      const trimmed = history.slice(-50);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(revisionNotes));
    } catch {
      // ignore
    }
  }, [revisionNotes]);

  const addEntry = useCallback((question: string, answer: InterviewAnswer): HistoryEntry => {
    const entry: HistoryEntry = {
      id: generateId(),
      question,
      answer,
      timestamp: new Date().toISOString(),
      strength: 'neutral',
    };
    setHistory(prev => [entry, ...prev]);
    return entry;
  }, []);

  const updateStrength = useCallback((id: string, strength: HistoryEntry['strength']) => {
    setHistory(prev =>
      prev.map(entry => (entry.id === id ? { ...entry, strength } : entry))
    );
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setHistory(prev => prev.filter(entry => entry.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const saveRevisionNote = useCallback((entry: HistoryEntry) => {
    const note: RevisionNote = {
      id: generateId(),
      question: entry.question,
      keyPoints: entry.answer.keyPoints,
      shortVersion: entry.answer.shortVersion,
      category: entry.answer.category,
      createdAt: new Date().toISOString(),
    };
    setRevisionNotes(prev => [note, ...prev]);
    return note;
  }, []);

  const deleteRevisionNote = useCallback((id: string) => {
    setRevisionNotes(prev => prev.filter(note => note.id !== id));
  }, []);

  const weakQuestions = history.filter(e => e.strength === 'weak');
  const strongQuestions = history.filter(e => e.strength === 'strong');

  return {
    history,
    revisionNotes,
    addEntry,
    updateStrength,
    deleteEntry,
    clearHistory,
    saveRevisionNote,
    deleteRevisionNote,
    weakQuestions,
    strongQuestions,
  };
}
