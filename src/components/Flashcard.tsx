import { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import type { Flashcard } from '../services/gemini';

interface FlashcardProps {
  card: Flashcard;
  index: number;
}

export function FlashcardItem({ card, index }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="cursor-pointer group"
      onClick={() => setFlipped(!flipped)}
      style={{ perspective: '1000px' }}
    >
      <div
        className="relative transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          minHeight: '180px',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl glass p-6 flex flex-col justify-between"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-brand-400">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-brand-400/80 font-medium uppercase tracking-wider mb-2">Question</p>
              <p className="text-white/90 font-medium leading-relaxed">{card.question}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/30 mt-4">
            <ChevronDown size={12} />
            <span>Click to reveal answer</span>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl p-6 flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, rgba(61,86,250,0.12), rgba(124,58,237,0.08))',
            border: '1px solid rgba(61,86,250,0.25)',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lightbulb size={12} className="text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-violet-400/80 font-medium uppercase tracking-wider mb-2">Answer</p>
              <p className="text-white leading-relaxed">{card.answer}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/30 mt-4">
            <ChevronUp size={12} />
            <span>Click to go back</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FlashcardGridProps {
  cards: Flashcard[];
}

export function FlashcardGrid({ cards }: FlashcardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cards.map((card, i) => (
        <FlashcardItem key={card.id} card={card} index={i} />
      ))}
    </div>
  );
}
