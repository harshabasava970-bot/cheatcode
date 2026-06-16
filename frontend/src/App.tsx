import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { MicButton } from './components/MicButton';
import { TranscriptPanel } from './components/TranscriptPanel';
import { AnswerPanel } from './components/AnswerPanel';
import { HistorySidebar } from './components/HistorySidebar';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useHistory } from './hooks/useHistory';
import { fetchAnswer, checkHealth } from './api';
import { InterviewAnswer, SessionStatus, HistoryEntry } from './types';
import { AlertCircle, PanelRightOpen, PanelRightClose } from 'lucide-react';

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState<InterviewAnswer | null>(null);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const processingRef = useRef(false);

  const {
    history,
    revisionNotes,
    addEntry,
    updateStrength,
    deleteEntry,
    clearHistory,
    saveRevisionNote,
    deleteRevisionNote,
  } = useHistory();

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Backend health check
  useEffect(() => {
    checkHealth().then(setIsBackendOnline);
    const interval = setInterval(() => checkHealth().then(setIsBackendOnline), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleQuestion = useCallback(async (question: string) => {
    if (processingRef.current || !question.trim()) return;
    processingRef.current = true;

    setCurrentQuestion(question);
    setCurrentAnswer(null);
    setAnswerError(null);
    setManualInput('');
    setStatus('processing');

    try {
      const answer = await fetchAnswer(question);
      setCurrentAnswer(answer);
      setStatus('answered');
      setSessionCount(c => c + 1);
      addEntry(question, answer);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to get answer';
      setAnswerError(message);
      setStatus('idle');
    } finally {
      processingRef.current = false;
    }
  }, [addEntry]);

  const { isListening, transcript, interimTranscript, startListening, stopListening, isSupported, error: speechError } = useSpeechRecognition({
    onFinalTranscript: handleQuestion,
    silenceThreshold: 2000,
  });

  useEffect(() => {
    if (speechError) setGlobalError(speechError);
  }, [speechError]);

  const handleStart = useCallback(() => {
    setGlobalError(null);
    setStatus('listening');
    startListening();
  }, [startListening]);

  const handleStop = useCallback(() => {
    stopListening();
    setStatus('idle');
  }, [stopListening]);

  const handleSelectEntry = useCallback((entry: HistoryEntry) => {
    setCurrentQuestion(entry.question);
    setCurrentAnswer(entry.answer);
    setStatus('answered');
    setAnswerError(null);
  }, []);

  // Sync listening state to status
  useEffect(() => {
    if (!isListening && status === 'listening') {
      setStatus('idle');
    }
  }, [isListening, status]);

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-950' : 'bg-gray-100'} transition-colors duration-300`}>
      <Header
        isDark={isDark}
        onToggleTheme={() => setIsDark(v => !v)}
        isBackendOnline={isBackendOnline}
        sessionCount={sessionCount}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Global error banner */}
        {globalError && (
          <div className="mb-4 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-red-300 text-sm flex-1">{globalError}</p>
            <button onClick={() => setGlobalError(null)} className="text-red-400 hover:text-red-200 text-lg leading-none">×</button>
          </div>
        )}

        {/* API offline warning */}
        {!isBackendOnline && (
          <div className="mb-4 flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-amber-300 text-sm">
              Backend API is offline. Make sure the server is running on port 5000 and your <code className="bg-gray-800 px-1 rounded">.env</code> has a valid <code className="bg-gray-800 px-1 rounded">OPENAI_API_KEY</code>.
            </p>
          </div>
        )}

        <div className="flex gap-4 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Microphone control card */}
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <MicButton
                  status={status}
                  onStart={handleStart}
                  onStop={handleStop}
                  isSupported={isSupported}
                />
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-white font-semibold text-lg">Interview Practice Mode</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {status === 'listening'
                      ? 'Listening... Ask your interview question clearly. Will auto-submit after 2 seconds of silence.'
                      : status === 'processing'
                      ? 'Processing your question and generating an expert answer...'
                      : status === 'answered'
                      ? 'Answer ready! Ask another question or click Start to continue practicing.'
                      : 'Click Start Microphone to begin. Speak your interview question, then stay silent for 2 seconds to get an AI answer.'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {['React', 'Node.js', 'Python', 'JavaScript', 'Java', 'SQL', 'DSA', 'System Design', 'Docker', 'AWS', 'HR', 'Next.js'].map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-700/60 text-gray-400 border border-gray-600/40">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sidebar toggle */}
                <button
                  onClick={() => setShowSidebar(v => !v)}
                  className="hidden lg:flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors"
                  aria-label="Toggle history sidebar"
                >
                  {showSidebar
                    ? <PanelRightClose className="w-4 h-4" />
                    : <PanelRightOpen className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>

            {/* Transcript */}
            <TranscriptPanel
              transcript={transcript}
              interimTranscript={interimTranscript}
              status={status}
              onManualSubmit={handleQuestion}
              manualInput={manualInput}
              onManualInputChange={setManualInput}
            />

            {/* Answer */}
            <div style={{ minHeight: '420px' }}>
              <AnswerPanel
                question={currentQuestion}
                answer={currentAnswer}
                isLoading={status === 'processing'}
                error={answerError}
              />
            </div>
          </div>

          {/* Sidebar */}
          {showSidebar && (
            <aside className="hidden lg:block w-72 xl:w-80 shrink-0 sticky top-[80px]" style={{ height: 'calc(100vh - 120px)' }}>
              <HistorySidebar
                history={history}
                revisionNotes={revisionNotes}
                onSelectEntry={handleSelectEntry}
                onUpdateStrength={updateStrength}
                onDeleteEntry={deleteEntry}
                onSaveNote={saveRevisionNote}
                onDeleteNote={deleteRevisionNote}
                onClearHistory={clearHistory}
              />
            </aside>
          )}
        </div>

        {/* Mobile history (collapsed at bottom on small screens) */}
        <div className="lg:hidden mt-4">
          <HistorySidebar
            history={history}
            revisionNotes={revisionNotes}
            onSelectEntry={handleSelectEntry}
            onUpdateStrength={updateStrength}
            onDeleteEntry={deleteEntry}
            onSaveNote={saveRevisionNote}
            onDeleteNote={deleteRevisionNote}
            onClearHistory={clearHistory}
          />
        </div>
      </main>
    </div>
  );
}
