import React from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { SessionStatus } from '../types';

interface MicButtonProps {
  status: SessionStatus;
  onStart: () => void;
  onStop: () => void;
  isSupported: boolean;
}

export const MicButton: React.FC<MicButtonProps> = ({ status, onStart, onStop, isSupported }) => {
  const isActive = status === 'listening' || status === 'processing';

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center opacity-50 cursor-not-allowed">
          <MicOff className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-sm text-red-400 text-center max-w-xs">
          Speech recognition not supported. Please use Chrome or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={isActive ? onStop : onStart}
        disabled={status === 'processing'}
        aria-label={isActive ? 'Stop listening' : 'Start microphone'}
        className={`
          relative w-20 h-20 rounded-full flex items-center justify-center
          transition-all duration-300 focus:outline-none focus:ring-4
          ${status === 'listening'
            ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400/40 shadow-lg shadow-red-500/40'
            : status === 'processing'
            ? 'bg-amber-500 cursor-not-allowed focus:ring-amber-400/40 shadow-lg shadow-amber-500/40'
            : 'bg-brand-500 hover:bg-brand-600 focus:ring-brand-400/40 shadow-lg shadow-brand-500/30'
          }
        `}
      >
        {/* Pulse rings for active listening */}
        {status === 'listening' && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
            <span className="absolute inset-[-6px] rounded-full border-2 border-red-400 animate-pulse opacity-40" />
          </>
        )}

        {status === 'listening' ? (
          <Square className="w-7 h-7 text-white fill-white" />
        ) : status === 'processing' ? (
          <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin" 
               style={{ borderWidth: '3px' }} />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
      </button>

      <div className="text-center">
        <p className={`text-sm font-semibold tracking-wide ${
          status === 'listening' ? 'text-red-400' :
          status === 'processing' ? 'text-amber-400' :
          status === 'answered' ? 'text-green-400' :
          'text-gray-400'
        }`}>
          {status === 'listening' ? '● Recording...' :
           status === 'processing' ? '◌ Generating answer...' :
           status === 'answered' ? '✓ Answer ready' :
           'Click to start'}
        </p>
        {status === 'listening' && (
          <p className="text-xs text-gray-500 mt-1">Silence for 2s will auto-submit</p>
        )}
      </div>
    </div>
  );
};
