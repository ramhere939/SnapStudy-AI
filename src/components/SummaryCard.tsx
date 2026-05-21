import { BookOpen, FileText, AlignLeft } from 'lucide-react';
import type { StudySet } from '../services/gemini';

interface SummaryCardProps {
  studySet: StudySet;
}

export default function SummaryCard({ studySet }: SummaryCardProps) {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <BookOpen size={16} className="text-violet-400" />
        </div>
        <div>
          <p className="text-xs text-violet-400/80 font-medium uppercase tracking-wider">Topic</p>
          <h3 className="text-base font-semibold text-white">{studySet.topic}</h3>
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {/* Summary */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-wider">
          <AlignLeft size={11} />
          <span>Summary</span>
        </div>
        <p className="text-sm text-white/70 leading-relaxed">{studySet.summary}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 pt-1">
        <div className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-lg">
          <FileText size={12} className="text-brand-400" />
          <span className="text-xs text-white/60">{studySet.flashcards.length} flashcards</span>
        </div>
        <div className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-lg">
          <span className="text-xs">⚡</span>
          <span className="text-xs text-white/60">Gemini 2.0 Flash</span>
        </div>
      </div>
    </div>
  );
}
