import { useState, useEffect } from 'react';
import { ChevronRight, RotateCcw, CheckCircle2, Trophy, Brain, Flame, Target } from 'lucide-react';
import type { Deck, SRSCard, SRSRating } from '../services/srs';
import { updateCardSRS, getDueCards, getNewCards, getDeckStats, saveDeck } from '../services/srs';

interface StudyModeProps {
  deck: Deck;
  onDeckUpdate: (deck: Deck) => void;
  onExit: () => void;
}

type SessionPhase = 'studying' | 'complete';

const RATING_CONFIG: { id: SRSRating; label: string; sublabel: string; color: string; bg: string; key: string }[] = [
  { id: 'again', label: 'Again',  sublabel: '< 1 min', color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30 hover:bg-red-500/25',    key: '1' },
  { id: 'hard',  label: 'Hard',   sublabel: '< 10 min', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30 hover:bg-orange-500/25', key: '2' },
  { id: 'good',  label: 'Good',   sublabel: '1 day',    color: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/30 hover:bg-green-500/25',  key: '3' },
  { id: 'easy',  label: 'Easy',   sublabel: '4 days',   color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30 hover:bg-blue-500/25',    key: '4' },
];

export default function StudyMode({ deck, onDeckUpdate, onExit }: StudyModeProps) {
  const [currentDeck, setCurrentDeck] = useState<Deck>(deck);
  const [queue, setQueue] = useState<SRSCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [phase, setPhase] = useState<SessionPhase>('studying');
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0, total: 0 });

  // Build study queue: due cards first, then new cards
  useEffect(() => {
    const due = getDueCards(currentDeck);
    const newCards = getNewCards(currentDeck);
    // Combine: due first, then new (up to 20 total per session)
    const q = [...due, ...newCards.filter(c => !due.includes(c))].slice(0, 20);
    setQueue(q);
    setCurrentIdx(0);
    setShowAnswer(false);
    if (q.length === 0) setPhase('complete');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase !== 'studying') return;
      if (e.key === ' ' || e.key === 'Enter') {
        if (!showAnswer) setShowAnswer(true);
        return;
      }
      if (showAnswer) {
        const r = RATING_CONFIG.find(r => r.key === e.key);
        if (r) handleRate(r.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showAnswer, phase, currentIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRate = (rating: SRSRating) => {
    const card = queue[currentIdx];
    const updatedCard = updateCardSRS(card, rating);

    // Update deck
    const updatedCards = currentDeck.cards.map(c => c.id === card.id ? updatedCard : c);
    const updatedDeck = { ...currentDeck, cards: updatedCards };
    setCurrentDeck(updatedDeck);
    saveDeck(updatedDeck);
    onDeckUpdate(updatedDeck);

    // Stats
    setSessionStats(s => ({ ...s, [rating]: s[rating] + 1, total: s.total + 1 }));

    // Advance
    const next = currentIdx + 1;
    if (next >= queue.length) {
      setPhase('complete');
    } else {
      setCurrentIdx(next);
      setShowAnswer(false);
    }
  };

  if (phase === 'complete') {
    return <SessionComplete stats={sessionStats} deck={currentDeck} onExit={onExit} onRestart={() => {
      const newQueue = getDueCards(currentDeck).slice(0, 20);
      if (newQueue.length > 0) {
        setQueue(newQueue);
        setCurrentIdx(0);
        setShowAnswer(false);
        setPhase('studying');
        setSessionStats({ again: 0, hard: 0, good: 0, easy: 0, total: 0 });
      } else {
        onExit();
      }
    }} />; 
  }

  if (queue.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center mx-auto">
          <CheckCircle2 size={28} className="text-green-400" />
        </div>
        <p className="text-white font-semibold">All caught up!</p>
        <p className="text-sm text-white/40">No cards due for review right now.</p>
        <button onClick={onExit} className="btn-secondary text-sm py-2 px-4">← Back to Cards</button>
      </div>
    );
  }

  const card = queue[currentIdx];
  const progress = currentIdx / queue.length;
  const stats = getDeckStats(currentDeck);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1">
            ← Back
          </button>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Brain size={12} className="text-brand-400" />
            <span className="text-brand-400 font-medium">{currentDeck.topic}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="text-white/60 font-semibold">{currentIdx + 1}</span>
          <span>/</span>
          <span>{queue.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Mini stats row */}
      <div className="flex gap-2">
        {[
          { label: 'Due', val: stats.due,      color: 'text-orange-400' },
          { label: 'New', val: stats.new,      color: 'text-blue-400'   },
          { label: 'Mastered', val: stats.mastered, color: 'text-green-400'  },
        ].map(({ label, val, color }) => (
          <div key={label} className="glass rounded-xl px-3 py-2 text-center flex-1">
            <p className={`text-sm font-bold ${color}`}>{val}</p>
            <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="glass-strong rounded-3xl overflow-hidden" style={{ minHeight: '260px' }}>
        {/* Question */}
        <div className="p-6 pb-4">
          <p className="text-[10px] font-semibold text-brand-400/70 uppercase tracking-widest mb-3">Question</p>
          <p className="text-lg text-white/95 font-medium leading-relaxed">{card.question}</p>
        </div>

        {/* Answer (hidden until revealed) */}
        {showAnswer ? (
          <>
            <div className="h-px bg-white/5 mx-6" />
            <div className="p-6 pt-4">
              <p className="text-[10px] font-semibold text-violet-400/70 uppercase tracking-widest mb-3">Answer</p>
              <p className="text-base text-white/85 leading-relaxed">{card.answer}</p>
              {card.lapses > 0 && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-orange-400/60">
                  <Flame size={11} />
                  <span>Lapsed {card.lapses}× — keep practicing!</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="px-6 pb-6 pt-2">
            <button
              onClick={() => setShowAnswer(true)}
              className="w-full py-3 rounded-2xl glass border border-white/10 text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-all font-medium"
            >
              Show Answer · Space
            </button>
          </div>
        )}
      </div>

      {/* Rating buttons */}
      {showAnswer && (
        <div className="space-y-2 animate-fade-up">
          <p className="text-[10px] text-white/25 text-center uppercase tracking-widest">How well did you know this?</p>
          <div className="grid grid-cols-4 gap-2">
            {RATING_CONFIG.map(r => (
              <button
                key={r.id}
                onClick={() => handleRate(r.id)}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border transition-all duration-150 active:scale-95 ${r.bg}`}
              >
                <span className={`text-sm font-bold ${r.color}`}>{r.label}</span>
                <span className="text-[10px] text-white/30">{r.sublabel}</span>
                <span className="text-[10px] text-white/20 font-mono">[{r.key}]</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Session Complete Screen ────────────────────────────────────────────────────
function SessionComplete({
  stats, deck, onExit, onRestart,
}: {
  stats: { again: number; hard: number; good: number; easy: number; total: number };
  deck: Deck;
  onExit: () => void;
  onRestart: () => void;
}) {
  const accuracy = stats.total > 0
    ? Math.round(((stats.good + stats.easy) / stats.total) * 100)
    : 0;

  const deckStats = getDeckStats(deck);
  const nextDue = getDueCards(deck);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Trophy */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center mx-auto border border-yellow-500/20">
          <Trophy size={32} className="text-yellow-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Session Complete!</h2>
          <p className="text-sm text-white/40 mt-1">You reviewed {stats.total} cards</p>
        </div>
      </div>

      {/* Score ring */}
      <div className="flex items-center justify-center">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
            <circle cx="56" cy="56" r="46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
              cx="56" cy="56" r="46" fill="none"
              stroke="url(#sg)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 46}`}
              strokeDashoffset={`${2 * Math.PI * 46 * (1 - accuracy / 100)}`}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
            <defs>
              <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
                <stop stopColor="#3d56fa" /><stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{accuracy}%</span>
            <span className="text-[10px] text-white/40">accuracy</span>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-4 gap-2">
        {RATING_CONFIG.map(r => (
          <div key={r.id} className={`glass rounded-2xl p-3 text-center border ${r.bg.split(' ')[1]}`}>
            <p className={`text-lg font-bold ${r.color}`}>{stats[r.id]}</p>
            <p className="text-[10px] text-white/30 mt-0.5">{r.label}</p>
          </div>
        ))}
      </div>

      {/* Deck progress */}
      <div className="glass rounded-2xl p-4 space-y-2.5">
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider flex items-center gap-1.5">
          <Target size={11} /> Deck Progress
        </p>
        <div className="flex gap-2">
          {[
            { label: 'New',      val: deckStats.new,      color: 'bg-blue-500'  },
            { label: 'Learning', val: deckStats.learning,  color: 'bg-orange-500' },
            { label: 'Mastered', val: deckStats.mastered,  color: 'bg-green-500' },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex-1 text-center">
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full ${color}`}
                  style={{ width: `${(val / deckStats.total) * 100}%`, transition: 'width 1s ease-out' }} />
              </div>
              <p className="text-xs text-white/50 mt-1">{val} {label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {nextDue.length > 0 ? (
          <button onClick={onRestart} className="btn-primary flex-1 justify-center py-3">
            <RotateCcw size={15} />
            Keep Studying ({nextDue.length})
          </button>
        ) : (
          <div className="flex-1 glass rounded-xl p-3 text-center">
            <p className="text-xs text-green-400 font-medium">🎉 No more due cards today!</p>
            <p className="text-xs text-white/30 mt-0.5">Come back tomorrow for your next review</p>
          </div>
        )}
        <button onClick={onExit} className="btn-secondary py-3 px-5">
          <ChevronRight size={15} />
          Done
        </button>
      </div>
    </div>
  );
}
