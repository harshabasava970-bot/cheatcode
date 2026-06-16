import React from 'react';
import { Target, Moon, Sun, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  isBackendOnline: boolean;
  sessionCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isDark,
  onToggleTheme,
  isBackendOnline,
  sessionCount,
}) => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">CheatCode</h1>
            <p className="text-gray-500 text-xs">AI Interview Practice</p>
          </div>
        </div>

        {/* Center — session counter */}
        {sessionCount > 0 && (
          <div className="hidden sm:flex items-center gap-2 bg-gray-800/60 rounded-full px-4 py-1.5 border border-gray-700/50">
            <span className="text-xs text-gray-400">Session:</span>
            <span className="text-xs font-bold text-brand-400">{sessionCount} Q&A</span>
          </div>
        )}

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Backend status */}
          <div className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
            isBackendOnline
              ? 'text-green-400 border-green-500/30 bg-green-500/10'
              : 'text-red-400 border-red-500/30 bg-red-500/10'
          }`}>
            {isBackendOnline
              ? <><Wifi className="w-3 h-3" /> API Online</>
              : <><WifiOff className="w-3 h-3" /> API Offline</>
            }
          </div>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-xl bg-gray-800/60 border border-gray-700/50 flex items-center justify-center
                       hover:bg-gray-700/60 transition-colors duration-200 text-gray-400 hover:text-gray-200"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
