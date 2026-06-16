import React, { useState } from 'react';
import { Sparkles, List, Clock, BookOpen, HelpCircle, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { InterviewAnswer, AnswerTab } from '../types';

interface AnswerPanelProps {
  question: string;
  answer: InterviewAnswer | null;
  isLoading: boolean;
  error: string | null;
}

const TABS: { id: AnswerTab; label: string; icon: React.ReactNode }[] = [
  { id: 'direct', label: 'Direct', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'keypoints', label: 'Key Points', icon: <List className="w-3.5 h-3.5" /> },
  { id: 'short', label: '30-sec', icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'detailed', label: 'Detailed', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: 'followup', label: 'Follow-ups', icon: <HelpCircle className="w-3.5 h-3.5" /> },
];

const DIFFICULTY_COLORS = {
  Easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  Medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Hard: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const CATEGORY_COLORS: Record<string, string> = {
  DSA: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  OOP: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  DBMS: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  OS: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  CN: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  HR: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  Programming: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  default: 'bg-brand-500/20 text-brand-400 border-brand-500/30',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-gray-200"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export const AnswerPanel: React.FC<AnswerPanelProps> = ({ question, answer, isLoading, error }) => {
  const [activeTab, setActiveTab] = useState<AnswerTab>('direct');
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(true);

  const categoryColor = answer
    ? CATEGORY_COLORS[answer.category] || CATEGORY_COLORS.default
    : CATEGORY_COLORS.default;

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-gray-700/50">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">AI Answer</h2>
          {answer && (
            <div className="ml-auto flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${categoryColor}`}>
                {answer.category}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${DIFFICULTY_COLORS[answer.difficulty]}`}>
                {answer.difficulty}
              </span>
            </div>
          )}
        </div>

        {/* Question display */}
        {question && (
          <div className="bg-gray-900/50 rounded-xl p-3">
            <button
              onClick={() => setIsQuestionExpanded(v => !v)}
              className="flex items-center gap-2 w-full text-left"
            >
              <span className="text-xs text-brand-400 font-semibold uppercase tracking-wide">Q:</span>
              <span className={`text-sm text-gray-200 flex-1 ${!isQuestionExpanded ? 'truncate' : ''}`}>
                {question}
              </span>
              {question.length > 80 && (
                isQuestionExpanded
                  ? <ChevronUp className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  : <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      {answer && (
        <div className="flex gap-1 px-5 pt-4 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                whitespace-nowrap transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-brand-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-brand-400 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-gray-300 font-medium">Generating your answer...</p>
              <p className="text-gray-500 text-sm mt-1">Crafting an interview-ready response</p>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <span className="text-red-400 text-lg">⚠</span>
            <div>
              <p className="text-red-300 font-medium text-sm">Error</p>
              <p className="text-red-400/80 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && !answer && (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-gray-500" />
            </div>
            <p className="text-gray-400 font-medium">Ready to help</p>
            <p className="text-gray-600 text-sm mt-1">Ask an interview question to get started</p>
          </div>
        )}

        {!isLoading && !error && answer && (
          <div className="animate-fade-in">
            {activeTab === 'direct' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Direct Answer</h3>
                  <CopyButton text={answer.directAnswer} />
                </div>
                <p className="text-gray-200 text-sm leading-relaxed bg-gray-900/40 rounded-xl p-4 border border-gray-700/30">
                  {answer.directAnswer}
                </p>
              </div>
            )}

            {activeTab === 'keypoints' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Key Points</h3>
                  <CopyButton text={answer.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')} />
                </div>
                <ul className="space-y-2">
                  {answer.keyPoints.map((point, i) => (
                    <li key={i} className="flex gap-3 bg-gray-900/40 rounded-xl p-3 border border-gray-700/30">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-500/20 text-brand-400
                                       text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-gray-200 text-sm leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'short' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    30-Second Interview Version
                  </h3>
                  <CopyButton text={answer.shortVersion} />
                </div>
                <div className="bg-gray-900/40 rounded-xl p-4 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs text-amber-400 font-medium">Speak this aloud — natural & conversational</span>
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed">{answer.shortVersion}</p>
                </div>
              </div>
            )}

            {activeTab === 'detailed' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Detailed Answer (1-2 min)
                  </h3>
                  <CopyButton text={answer.detailedVersion} />
                </div>
                <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-700/30">
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                    {answer.detailedVersion}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'followup' && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Likely Follow-up Questions
                </h3>
                <div className="space-y-2">
                  {answer.followUpQuestions.map((q, i) => (
                    <div key={i} className="flex gap-3 bg-gray-900/40 rounded-xl p-3 border border-gray-700/30
                                             hover:border-brand-500/30 transition-colors duration-200">
                      <span className="text-brand-400 text-sm font-bold shrink-0">Q{i + 1}</span>
                      <p className="text-gray-300 text-sm">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
