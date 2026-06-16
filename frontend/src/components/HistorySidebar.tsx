import React, { useState } from 'react';
import {
  History, BookMarked, ThumbsUp, ThumbsDown, Trash2,
  BookOpen, X, ChevronRight, Star, BarChart2
} from 'lucide-react';
import { HistoryEntry, RevisionNote } from '../types';

interface HistorySidebarProps {
  history: HistoryEntry[];
  revisionNotes: RevisionNote[];
  onSelectEntry: (entry: HistoryEntry) => void;
  onUpdateStrength: (id: string, strength: HistoryEntry['strength']) => void;
  onDeleteEntry: (id: string) => void;
  onSaveNote: (entry: HistoryEntry) => void;
  onDeleteNote: (id: string) => void;
  onClearHistory: () => void;
}

type SidebarTab = 'history' | 'notes' | 'stats';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

const STRENGTH_COLORS = {
  weak: 'text-red-400 bg-red-500/10 border-red-500/20',
  strong: 'text-green-400 bg-green-500/10 border-green-500/20',
  neutral: 'text-gray-400 bg-gray-700/30 border-gray-600/30',
};

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  history,
  revisionNotes,
  onSelectEntry,
  onUpdateStrength,
  onDeleteEntry,
  onSaveNote,
  onDeleteNote,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('history');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const weakCount = history.filter(e => e.strength === 'weak').length;
  const strongCount = history.filter(e => e.strength === 'strong').length;

  const categoryCounts = history.reduce<Record<string, number>>((acc, e) => {
    const cat = e.answer.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-700/50">
        {[
          { id: 'history' as SidebarTab, label: 'History', icon: <History className="w-3.5 h-3.5" />, count: history.length },
          { id: 'notes' as SidebarTab, label: 'Notes', icon: <BookMarked className="w-3.5 h-3.5" />, count: revisionNotes.length },
          { id: 'stats' as SidebarTab, label: 'Stats', icon: <BarChart2 className="w-3.5 h-3.5" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium
              transition-colors duration-200
              ${activeTab === tab.id
                ? 'text-brand-400 border-b-2 border-brand-400'
                : 'text-gray-500 hover:text-gray-300'
              }
            `}
          >
            {tab.icon}
            {tab.label}
            {'count' in tab && tab.count != null && tab.count > 0 && (
              <span className="bg-gray-600 text-gray-300 text-[10px] px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="p-3 space-y-2">
            {history.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No questions yet</p>
                <p className="text-gray-600 text-xs mt-1">Start practicing to build history</p>
              </div>
            ) : (
              <>
                {history.map(entry => (
                  <div key={entry.id}
                       className={`rounded-xl border transition-all duration-200 overflow-hidden
                                   ${STRENGTH_COLORS[entry.strength]}`}>
                    <div
                      className="flex items-start gap-2 p-3 cursor-pointer hover:bg-white/5"
                      onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-200 text-xs font-medium leading-relaxed line-clamp-2">
                          {entry.question}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-gray-500">{formatTime(entry.timestamp)}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-700/50 text-gray-400">
                            {entry.answer.category}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5 transition-transform duration-200 ${
                        expandedId === entry.id ? 'rotate-90' : ''
                      }`} />
                    </div>

                    {expandedId === entry.id && (
                      <div className="px-3 pb-3 border-t border-gray-700/30 pt-2 space-y-2">
                        <p className="text-gray-400 text-xs leading-relaxed">
                          {entry.answer.directAnswer}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => onSelectEntry(entry)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors"
                          >
                            View full answer
                          </button>
                          <button
                            onClick={() => onUpdateStrength(entry.id, entry.strength === 'weak' ? 'neutral' : 'weak')}
                            className={`text-[10px] px-2 py-1 rounded-lg transition-colors flex items-center gap-1
                                        ${entry.strength === 'weak'
                                          ? 'bg-red-500/30 text-red-300'
                                          : 'bg-gray-700/50 text-gray-400 hover:bg-red-500/20 hover:text-red-400'}`}
                          >
                            <ThumbsDown className="w-2.5 h-2.5" />
                            Weak
                          </button>
                          <button
                            onClick={() => onUpdateStrength(entry.id, entry.strength === 'strong' ? 'neutral' : 'strong')}
                            className={`text-[10px] px-2 py-1 rounded-lg transition-colors flex items-center gap-1
                                        ${entry.strength === 'strong'
                                          ? 'bg-green-500/30 text-green-300'
                                          : 'bg-gray-700/50 text-gray-400 hover:bg-green-500/20 hover:text-green-400'}`}
                          >
                            <ThumbsUp className="w-2.5 h-2.5" />
                            Strong
                          </button>
                          <button
                            onClick={() => onSaveNote(entry)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-gray-700/50 text-gray-400 hover:bg-amber-500/20 hover:text-amber-400 transition-colors flex items-center gap-1"
                          >
                            <Star className="w-2.5 h-2.5" />
                            Save note
                          </button>
                          <button
                            onClick={() => onDeleteEntry(entry.id)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-gray-700/50 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div className="pt-2">
                  {!showClearConfirm ? (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="w-full text-xs text-gray-500 hover:text-red-400 py-2 transition-colors"
                    >
                      Clear all history
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { onClearHistory(); setShowClearConfirm(false); }}
                        className="flex-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 py-1.5 rounded-lg transition-colors"
                      >
                        Confirm clear
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="flex-1 text-xs bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 py-1.5 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="p-3 space-y-2">
            {revisionNotes.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No revision notes</p>
                <p className="text-gray-600 text-xs mt-1">Save questions as notes from history</p>
              </div>
            ) : (
              revisionNotes.map(note => (
                <div key={note.id} className="bg-gray-900/40 rounded-xl border border-gray-700/30 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-gray-200 text-xs font-medium line-clamp-2 flex-1">{note.question}</p>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-700/50 text-gray-400 mt-1.5 inline-block">
                    {note.category}
                  </span>
                  <ul className="mt-2 space-y-1">
                    {note.keyPoints.slice(0, 3).map((point, i) => (
                      <li key={i} className="text-[11px] text-gray-400 flex gap-1.5">
                        <span className="text-brand-400 shrink-0">•</span>
                        <span className="line-clamp-1">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-900/40 rounded-xl p-3 text-center border border-gray-700/30">
                <p className="text-2xl font-bold text-white">{history.length}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Total</p>
              </div>
              <div className="bg-green-500/10 rounded-xl p-3 text-center border border-green-500/20">
                <p className="text-2xl font-bold text-green-400">{strongCount}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Strong</p>
              </div>
              <div className="bg-red-500/10 rounded-xl p-3 text-center border border-red-500/20">
                <p className="text-2xl font-bold text-red-400">{weakCount}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Weak</p>
              </div>
            </div>

            {Object.keys(categoryCounts).length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">
                  By Category
                </p>
                <div className="space-y-1.5">
                  {Object.entries(categoryCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, count]) => (
                      <div key={cat} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-24 truncate">{cat}</span>
                        <div className="flex-1 bg-gray-700/30 rounded-full h-1.5">
                          <div
                            className="bg-brand-500 rounded-full h-1.5 transition-all duration-500"
                            style={{ width: `${(count / history.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-5 text-right">{count}</span>
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
