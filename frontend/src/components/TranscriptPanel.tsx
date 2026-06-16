import React from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { SessionStatus } from '../types';

interface TranscriptPanelProps {
  transcript: string;
  interimTranscript: string;
  status: SessionStatus;
  onManualSubmit: (text: string) => void;
  manualInput: string;
  onManualInputChange: (value: string) => void;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  transcript,
  interimTranscript,
  status,
  onManualSubmit,
  manualInput,
  onManualInputChange,
}) => {
  const hasContent = transcript || interimTranscript;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (manualInput.trim()) onManualSubmit(manualInput.trim());
    }
  };

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-brand-400" />
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Live Transcript</h2>
        {status === 'listening' && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-red-400">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Live speech area */}
      <div className={`
        min-h-[80px] rounded-xl p-4 mb-4 transition-all duration-300
        ${status === 'listening'
          ? 'bg-gray-900/80 border border-brand-500/40'
          : 'bg-gray-900/40 border border-gray-700/30'}
      `}>
        {hasContent ? (
          <p className="text-gray-200 text-sm leading-relaxed">
            {transcript && <span className="text-white">{transcript} </span>}
            {interimTranscript && (
              <span className="text-gray-400 italic">{interimTranscript}</span>
            )}
          </p>
        ) : (
          <p className="text-gray-500 text-sm italic">
            {status === 'listening'
              ? 'Listening... speak your interview question'
              : 'Start microphone or type your question below'}
          </p>
        )}
      </div>

      {/* Manual text input */}
      <div className="relative">
        <textarea
          value={manualInput}
          onChange={e => onManualInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Or type your question here... (Enter to submit)"
          rows={2}
          disabled={status === 'processing'}
          className="w-full bg-gray-900/60 border border-gray-600/50 rounded-xl px-4 py-3 pr-12
                     text-sm text-gray-200 placeholder-gray-500 resize-none
                     focus:outline-none focus:border-brand-500/70 focus:ring-1 focus:ring-brand-500/30
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200"
        />
        <button
          onClick={() => manualInput.trim() && onManualSubmit(manualInput.trim())}
          disabled={!manualInput.trim() || status === 'processing'}
          aria-label="Submit question"
          className="absolute right-3 bottom-3 p-1.5 rounded-lg bg-brand-500 hover:bg-brand-600
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors duration-200"
        >
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
};
