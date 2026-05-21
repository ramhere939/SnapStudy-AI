import { Brain, ScanLine, Zap } from 'lucide-react';

interface Step {
  icon: React.ReactNode;
  label: string;
  color: string;
}

const STEPS: Step[] = [
  { icon: <ScanLine size={16} />, label: 'Scanning image with OCR…', color: 'text-blue-400' },
  { icon: <Brain size={16} />, label: 'Gemini AI processing notes…', color: 'text-violet-400' },
  { icon: <Zap size={16} />, label: 'Generating flashcards…', color: 'text-brand-400' },
];

interface LoadingStateProps {
  stage: 'ocr' | 'ai' | 'done';
  ocrProgress?: number;
}

export default function LoadingState({ stage, ocrProgress = 0 }: LoadingStateProps) {
  const stageIndex = stage === 'ocr' ? 0 : stage === 'ai' ? 1 : 2;

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      {/* Animated orb */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-glow-lg">
          <Brain size={32} className="text-white animate-pulse" />
        </div>
        {/* Orbit rings */}
        <div className="absolute inset-0 rounded-full border-2 border-brand-500/30 animate-spin-slow" />
        <div className="absolute -inset-2 rounded-full border border-violet-500/20 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '5s' }} />
        <div className="absolute -inset-4 rounded-full border border-brand-500/10 animate-spin-slow" style={{ animationDuration: '12s' }} />
      </div>

      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-1">Generating your study set…</h3>
        <p className="text-sm text-white/40">This takes about 10–20 seconds</p>
      </div>

      {/* Step progress */}
      <div className="w-full max-w-sm space-y-3">
        {STEPS.map((step, i) => {
          const isActive = i === stageIndex;
          const isDone = i < stageIndex;

          return (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                isActive ? 'glass-strong' : isDone ? 'opacity-60' : 'opacity-30'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                isDone ? 'bg-green-500/20 text-green-400' :
                isActive ? `bg-brand-500/20 ${step.color} animate-pulse` :
                'bg-white/5 text-white/30'
              }`}>
                {isDone ? '✓' : step.icon}
              </div>
              <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/60'}`}>
                {step.label}
              </span>
              {isActive && i === 0 && ocrProgress > 0 && (
                <span className="ml-auto text-xs text-brand-400 font-mono">{ocrProgress}%</span>
              )}
              {isActive && i > 0 && (
                <div className="ml-auto flex gap-0.5">
                  {[0,1,2].map(d => (
                    <div
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
                      style={{ animationDelay: `${d * 150}ms` }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* OCR progress bar */}
      {stage === 'ocr' && (
        <div className="w-full max-w-sm">
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-300"
              style={{ width: `${ocrProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
