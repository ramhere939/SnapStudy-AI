import { useState, useCallback, useRef } from 'react';
import {
  ArrowRight, Sparkles, ScanLine, Brain, RotateCcw,
  CheckCircle2, ExternalLink, Clock, AlertCircle,
  BookOpen, ChevronRight, Zap, Flame,
} from 'lucide-react';
import Navbar from './components/Navbar';
import InputTabs from './components/InputTabs';
import type { InputMode } from './components/InputTabs';
import LoadingState from './components/LoadingState';
import SummaryCard from './components/SummaryCard';
import { FlashcardGrid } from './components/Flashcard';
import ApiKeyModal from './components/ApiKeyModal';
import StudyMode from './components/StudyMode';
import { extractTextFromImage } from './services/ocr';
import { extractTextFromPdf } from './services/pdf';
import { generateStudySet, GeminiError } from './services/gemini';
import { createDeck, saveDeck, loadDecks, getDeckStats } from './services/srs';
import type { Deck } from './services/srs';

type AppStage = 'idle' | 'extracting' | 'ai' | 'done' | 'error' | 'studying';

interface AppError {
  kind: string;
  lines: string[];
  retryAfterSeconds: number | null;
}

// ── Countdown Timer ───────────────────────────────────────────────────────────
import { useEffect } from 'react';

function CountdownTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) { onDone(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onDone]);
  const pct = ((seconds - remaining) / seconds) * 100;
  return (
    <div className="flex items-center gap-3 mt-3">
      <div className="relative w-8 h-8 flex-shrink-0">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="3" />
          <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(239,68,68,0.7)" strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 13}`}
            strokeDashoffset={`${2 * Math.PI * 13 * (1 - pct / 100)}`}
            style={{ transition: 'stroke-dashoffset 1s linear' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-red-300">{remaining}</span>
      </div>
      <p className="text-xs text-red-300/60">Retry available in <span className="text-red-300 font-semibold">{remaining}s</span></p>
    </div>
  );
}

// ── Error Card ────────────────────────────────────────────────────────────────
function ErrorCard({ error, onRetry, onChangeKey }: { error: AppError; onRetry: () => void; onChangeKey: () => void }) {
  const [canRetry, setCanRetry] = useState(error.retryAfterSeconds === null);
  const isQuota = error.kind === 'zero_quota' || error.kind === 'quota_exhausted';

  return (
    <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-300">
            {error.kind === 'zero_quota' ? '🚫 No Free Quota on This Key'
              : error.kind === 'quota_exhausted' ? '⏱ Rate Limit Hit'
              : error.kind === 'auth' ? '🔑 Invalid API Key'
              : 'Something went wrong'}
          </p>
          {error.lines.map((l, i) => (
            <p key={i} className={`text-sm leading-relaxed mt-1 ${i === 0 ? 'text-red-300/80' : 'text-red-300/50'}`}>{l}</p>
          ))}
        </div>
      </div>

      {error.kind === 'zero_quota' && (
        <div className="rounded-xl p-4 space-y-2 text-xs" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-white/50 font-semibold uppercase tracking-wider text-[10px]">Fix in 60 seconds:</p>
          {[
            { n: 1, text: 'Go to', link: { label: 'aistudio.google.com/app/apikey', url: 'https://aistudio.google.com/app/apikey' } },
            { n: 2, text: 'Sign in with a personal Gmail (not Workspace)' },
            { n: 3, text: 'Click "Create API Key" → "in new project"' },
            { n: 4, text: 'Paste the new key using the "API Key" button above' },
          ].map(({ n, text, link }) => (
            <div key={n} className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-brand-500/30 text-brand-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
              <span className="text-white/50">{text} {link && <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-brand-400 underline hover:text-brand-300">{link.label} <ExternalLink size={9} className="inline" /></a>}</span>
            </div>
          ))}
        </div>
      )}

      {error.retryAfterSeconds !== null && !canRetry && (
        <CountdownTimer seconds={error.retryAfterSeconds} onDone={() => setCanRetry(true)} />
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        <button onClick={onRetry} disabled={!canRetry}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors underline ${canRetry ? 'text-red-300 hover:text-red-200' : 'text-red-300/30 cursor-not-allowed'}`}>
          <Clock size={11} /> {canRetry ? 'Try again →' : 'Waiting…'}
        </button>
        <button onClick={onChangeKey} className="text-xs text-brand-400 hover:text-brand-300 underline transition-colors">
          Change API Key
        </button>
        {isQuota && (
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-white/30 hover:text-white/50 transition-colors">
            <ExternalLink size={10} /> Get free key
          </a>
        )}
      </div>
    </div>
  );
}

// ── Deck Library (previously saved decks) ─────────────────────────────────────
function DeckLibrary({ onStudy }: { onStudy: (deck: Deck) => void }) {
  const [decks] = useState(() => loadDecks());
  if (decks.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={14} className="text-violet-400" />
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Your Saved Decks</h2>
      </div>
      <div className="space-y-2">
        {decks.slice(0, 5).map(deck => {
          const stats = getDeckStats(deck);
          return (
            <div key={deck.id} className="glass rounded-2xl p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                <Brain size={16} className="text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{deck.topic}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-white/30">{stats.total} cards</span>
                  {stats.due > 0 && <span className="text-xs text-orange-400 font-medium flex items-center gap-1"><Flame size={9} /> {stats.due} due</span>}
                  {stats.mastered > 0 && <span className="text-xs text-green-400">{stats.mastered} mastered</span>}
                </div>
              </div>
              <button onClick={() => onStudy(deck)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs font-medium text-brand-400 hover:text-brand-300 hover:bg-brand-500/10 transition-all border border-brand-500/20">
                Study <ChevronRight size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [apiKey, setApiKey] = useState<string>(() => sessionStorage.getItem('snapstudy_key') || '');
  const [showModal, setShowModal] = useState(false);

  // Input state
  const [inputMode, setInputMode] = useState<InputMode>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [extractProgress, setExtractProgress] = useState(0);

  // App flow
  const [stage, setStage] = useState<AppStage>('idle');
  const [appError, setAppError] = useState<AppError | null>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [rawText, setRawText] = useState('');
  const [studyDeck, setStudyDeck] = useState<Deck | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleApiKeySave = (key: string) => {
    setApiKey(key);
    sessionStorage.setItem('snapstudy_key', key);
    setAppError(null);
  };

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setDeck(null); setAppError(null); setStage('idle'); setRawText('');
  }, []);

  const handleInputModeChange = (m: InputMode) => {
    setInputMode(m);
    setSelectedFile(null); setPreviewUrl(null);
    setDeck(null); setAppError(null); setStage('idle'); setRawText('');
  };

  const handleClear = useCallback(() => {
    setSelectedFile(null); setPreviewUrl(null); setTextInput('');
    setDeck(null); setAppError(null); setStage('idle'); setRawText(''); setExtractProgress(0);
  }, []);

  const hasInput = selectedFile !== null || (inputMode === 'text' && textInput.trim().length > 20);

  const handleGenerate = useCallback(async () => {
    if (!hasInput) return;
    if (!apiKey) { setShowModal(true); return; }

    setAppError(null); setDeck(null); setExtractProgress(0);

    try {
      let extracted = '';

      if (inputMode === 'text') {
        // Direct text — skip extraction
        extracted = textInput.trim();
        setRawText(extracted);
        setStage('ai');
      } else {
        // Image or PDF extraction
        setStage('extracting');
        if (inputMode === 'image' && selectedFile) {
          const res = await extractTextFromImage(selectedFile, setExtractProgress);
          extracted = res.text;
        } else if (inputMode === 'pdf' && selectedFile) {
          extracted = await extractTextFromPdf(selectedFile, setExtractProgress);
        }
        setRawText(extracted);
        setStage('ai');
      }

      // Gemini
      const result = await generateStudySet(extracted, apiKey);

      // Create and save SRS deck
      const newDeck = createDeck(result.topic, result.summary, result.flashcards);
      saveDeck(newDeck);
      setDeck(newDeck);
      setStage('done');

      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);

    } catch (err) {
      setStage('error');
      if (err instanceof GeminiError) {
        setAppError({ kind: err.kind, lines: err.message.split('\n').filter(Boolean), retryAfterSeconds: err.retryAfterSeconds });
      } else {
        const msg = err instanceof Error ? err.message : 'Something went wrong.';
        setAppError({ kind: 'unknown', lines: [msg], retryAfterSeconds: null });
      }
    }
  }, [hasInput, apiKey, inputMode, textInput, selectedFile]);

  const isLoading = stage === 'extracting' || stage === 'ai';

  // Study mode
  if (stage === 'studying' && studyDeck) {
    return (
      <div className="min-h-screen bg-surface-900">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-hero-gradient opacity-40" />
        </div>
        <Navbar hasApiKey={!!apiKey} onApiKeyClick={() => setShowModal(true)} />
        <ApiKeyModal isOpen={showModal} onSave={handleApiKeySave} onClose={() => setShowModal(false)} hasKey={!!apiKey} />
        <main className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-20">
          <StudyMode
            deck={studyDeck}
            onDeckUpdate={updated => { setStudyDeck(updated); if (deck?.id === updated.id) setDeck(updated); }}
            onExit={() => { setStage(deck ? 'done' : 'idle'); setStudyDeck(null); }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-900">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-hero-gradient opacity-60" />
        <div className="absolute top-40 left-[10%] w-64 h-64 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="absolute top-60 right-[10%] w-48 h-48 rounded-full bg-violet-500/8 blur-3xl" />
      </div>

      <Navbar hasApiKey={!!apiKey} onApiKeyClick={() => setShowModal(true)} />
      <ApiKeyModal isOpen={showModal} onSave={handleApiKeySave} onClose={() => setShowModal(false)} hasKey={!!apiKey} />

      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        {/* ── Hero ── */}
        <section className="text-center mb-14 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-brand-500/20 text-xs font-medium text-brand-400">
            <Sparkles size={11} className="animate-pulse" />
            Powered by Gemini 3.5 Flash + Tesseract OCR + SM-2 SRS
          </div>
          <h1 className="text-4xl sm:text-6xl font-display font-extrabold leading-tight tracking-tight">
            Turn Notes into{' '}
            <span className="gradient-text">Smart Flashcards</span>
            <br />
            <span className="text-white/80">Study Smarter.</span>
          </h1>
          <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
            Upload an image, PDF, or paste text — Gemini AI generates flashcards,
            then our spaced repetition engine schedules your reviews for maximum retention.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: <ScanLine size={13} />, label: 'OCR + PDF + Text' },
              { icon: <Brain size={13} />, label: 'Gemini 3.5 Flash' },
              { icon: <Zap size={13} />, label: 'SM-2 Spaced Repetition' },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-full text-xs text-white/50">
                <span className="text-brand-400">{b.icon}</span>{b.label}
              </div>
            ))}
          </div>
        </section>

        {/* ── Input Section ── */}
        <section className="glass-strong rounded-3xl p-6 sm:p-8 mb-8 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-brand-500 to-violet-500" />
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Upload or Paste Your Notes</h2>
          </div>

          <InputTabs
            mode={inputMode}
            onChange={handleInputModeChange}
            disabled={isLoading}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            onFileSelect={handleFileSelect}
            onClear={handleClear}
            textValue={textInput}
            onTextChange={setTextInput}
            extractProgress={extractProgress}
          />

          {hasInput && !isLoading && stage !== 'done' && (
            <button onClick={handleGenerate} className="btn-primary w-full justify-center py-4 text-base">
              <Sparkles size={18} /> Generate Flashcards <ArrowRight size={16} />
            </button>
          )}

          {inputMode === 'text' && !hasInput && textInput.length > 0 && textInput.length <= 20 && (
            <p className="text-xs text-orange-400/70 text-center">Please enter at least 20 characters</p>
          )}

          {stage === 'done' && (
            <button onClick={handleClear} className="btn-secondary w-full justify-center py-3.5">
              <RotateCcw size={16} /> Generate New Set
            </button>
          )}
        </section>

        {/* ── Loading ── */}
        {isLoading && (
          <section className="glass-strong rounded-3xl p-6 sm:p-8 mb-8 animate-fade-up">
            <LoadingState stage={stage === 'extracting' ? 'ocr' : 'ai'} ocrProgress={extractProgress} />
          </section>
        )}

        {/* ── Error ── */}
        {stage === 'error' && appError && (
          <section className="mb-8 animate-fade-up">
            <ErrorCard error={appError} onRetry={handleGenerate} onChangeKey={() => setShowModal(true)} />
          </section>
        )}

        {/* ── Results ── */}
        {deck && stage === 'done' && (
          <section ref={resultsRef} className="space-y-6 animate-fade-up">
            {/* Success + Study CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-300/80 flex-1">
                Generated <span className="text-green-300 font-semibold">{deck.cards.length} flashcards</span> for "{deck.topic}" — saved to your deck library
              </p>
              <button
                onClick={() => { setStudyDeck(deck); setStage('studying'); }}
                className="btn-primary py-2 px-4 text-sm whitespace-nowrap"
              >
                <Brain size={14} /> Start Studying
              </button>
            </div>

            <SummaryCard studySet={{ topic: deck.topic, summary: deck.summary, flashcards: deck.cards }} />

            {/* Flashcard browse grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-gradient-to-b from-brand-500 to-violet-500" />
                  <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Browse Cards — Click to Flip</h2>
                </div>
                <button
                  onClick={() => { setStudyDeck(deck); setStage('studying'); }}
                  className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                  <Zap size={12} /> Study Mode
                </button>
              </div>
              <FlashcardGrid cards={deck.cards} />
            </div>

            {/* Raw text */}
            {rawText && (
              <details className="glass rounded-2xl overflow-hidden group">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-white/5 transition-colors list-none">
                  <div className="flex items-center gap-2">
                    <ScanLine size={14} className="text-white/40" />
                    <span className="text-sm text-white/50 font-medium">Extracted Text</span>
                  </div>
                  <span className="text-white/30 text-xs group-open:hidden">Show ↓</span>
                  <span className="text-white/30 text-xs hidden group-open:block">Hide ↑</span>
                </summary>
                <div className="px-5 pb-5">
                  <pre className="text-xs text-white/40 whitespace-pre-wrap font-mono leading-relaxed bg-black/20 rounded-xl p-4 max-h-48 overflow-y-auto">{rawText}</pre>
                </div>
              </details>
            )}
          </section>
        )}

        {/* ── Deck Library ── */}
        {stage === 'idle' && !hasInput && (
          <DeckLibrary onStudy={d => { setStudyDeck(d); setStage('studying'); }} />
        )}

        {/* ── How It Works (idle, no decks) ── */}
        {stage === 'idle' && !hasInput && loadDecks().length === 0 && (
          <section className="mt-16">
            <p className="text-center text-xs text-white/30 uppercase tracking-widest mb-8 font-medium">How it works</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { step: '01', icon: '📸', title: 'Upload Anything', desc: 'Image, PDF, or paste text — we handle all formats.' },
                { step: '02', icon: '🤖', title: 'AI Generates Cards', desc: 'Gemini reads your notes and creates 5 targeted flashcards + summary.' },
                { step: '03', icon: '🧠', title: 'Spaced Repetition', desc: 'SM-2 algorithm schedules your reviews for maximum long-term retention.' },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="glass rounded-2xl p-5 space-y-3 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{icon}</span>
                    <span className="text-xs font-mono text-brand-500/50">{step}</span>
                  </div>
                  <h3 className="font-semibold text-white text-sm">{title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="relative border-t border-white/5 py-6 text-center">
        <p className="text-xs text-white/20">Built with ❤️ for the Gemini API Hackathon · SnapStudy AI © 2025</p>
      </footer>
    </div>
  );
}
