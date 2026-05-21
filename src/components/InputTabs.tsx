import { useRef, useState } from 'react';
import { ImageIcon, FileText, Type, Upload, X } from 'lucide-react';

export type InputMode = 'image' | 'pdf' | 'text';

interface InputTabsProps {
  mode: InputMode;
  onChange: (m: InputMode) => void;
  disabled?: boolean;

  // Image/PDF shared
  selectedFile: File | null;
  previewUrl: string | null;
  onFileSelect: (f: File) => void;
  onClear: () => void;

  // Text mode
  textValue: string;
  onTextChange: (v: string) => void;

  // Progress
  extractProgress: number;
}

const TABS: { id: InputMode; label: string; icon: React.ReactNode; accept: string }[] = [
  { id: 'image', label: 'Image', icon: <ImageIcon size={14} />, accept: 'image/*' },
  { id: 'pdf',   label: 'PDF',   icon: <FileText  size={14} />, accept: '.pdf'    },
  { id: 'text',  label: 'Text',  icon: <Type      size={14} />, accept: ''        },
];

export default function InputTabs({
  mode, onChange, disabled,
  selectedFile, previewUrl, onFileSelect, onClear,
  textValue, onTextChange, extractProgress,
}: InputTabsProps) {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const currentTab = TABS.find(t => t.id === mode)!;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const f = e.dataTransfer.files[0];
    if (!f) return;
    const isImg = f.type.startsWith('image/');
    const isPdf = f.type === 'application/pdf';
    if (mode === 'image' && isImg) onFileSelect(f);
    else if (mode === 'pdf' && isPdf) onFileSelect(f);
    else if (isImg) { onChange('image'); onFileSelect(f); }
    else if (isPdf) { onChange('pdf'); onFileSelect(f); }
  };

  // ── File preview ──────────────────────────────────────────────────────────
  if (selectedFile && mode !== 'text') {
    return (
      <div className="space-y-4">
        {/* Tab bar */}
        <TabBar mode={mode} onChange={onChange} disabled={disabled} />

        {/* Preview */}
        <div className="relative rounded-2xl overflow-hidden glass border border-white/10">
          {previewUrl && mode === 'image' ? (
            <img src={previewUrl} alt="Preview" className="w-full max-h-72 object-contain bg-surface-800" />
          ) : (
            <div className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center">
                <FileText size={22} className="text-red-400" />
              </div>
              <div>
                <p className="font-medium text-white text-sm truncate max-w-xs">{selectedFile.name}</p>
                <p className="text-xs text-white/40 mt-0.5">{(selectedFile.size / 1024).toFixed(0)} KB · PDF Document</p>
              </div>
            </div>
          )}
          {/* Overlay with file info + clear */}
          {mode === 'image' && previewUrl && (
            <div className="absolute inset-0 bg-gradient-to-t from-surface-900/80 via-transparent to-transparent" />
          )}
          <div className={`${mode === 'image' ? 'absolute bottom-3 right-3' : 'absolute top-3 right-3'}`}>
            {!disabled && (
              <button
                onClick={onClear}
                className="w-7 h-7 rounded-lg glass flex items-center justify-center hover:bg-red-500/20 transition-colors"
              >
                <X size={12} className="text-white/60" />
              </button>
            )}
          </div>
          {extractProgress > 0 && extractProgress < 100 && (
            <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-300"
                style={{ width: `${extractProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Text mode ─────────────────────────────────────────────────────────────
  if (mode === 'text') {
    return (
      <div className="space-y-4">
        <TabBar mode={mode} onChange={onChange} disabled={disabled} />
        <textarea
          value={textValue}
          onChange={e => onTextChange(e.target.value)}
          disabled={disabled}
          placeholder={`Paste your notes here...\n\nWorks great with:\n• Copied text from websites or docs\n• Typed lecture notes\n• Copied PDF text\n• Any plain text content`}
          rows={10}
          className="w-full bg-surface-700/50 border border-white/10 rounded-2xl px-4 py-4 text-sm text-white/85 placeholder-white/20 resize-none focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all font-mono leading-relaxed"
        />
        {textValue && (
          <p className="text-xs text-white/30 text-right">{textValue.length.toLocaleString()} characters</p>
        )}
      </div>
    );
  }

  // ── Drop zone ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <TabBar mode={mode} onChange={onChange} disabled={disabled} />

      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => !disabled && fileRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 select-none
          ${dragging ? 'border-brand-400 bg-brand-500/10 scale-[1.01]' : 'border-white/10 hover:border-brand-500/50 hover:bg-brand-500/5'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileRef}
          type="file"
          accept={currentTab.accept}
          onChange={e => { const f = e.target.files?.[0]; if (f) onFileSelect(f); }}
          className="hidden"
          disabled={disabled}
        />

        <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
          ${dragging ? 'bg-brand-500/30 scale-110' : 'bg-brand-500/15'}`}>
          <Upload size={28} className={`transition-all ${dragging ? 'text-brand-300 -translate-y-1' : 'text-brand-400'}`} />
          <div className="absolute inset-0 rounded-2xl border border-brand-500/30 animate-ping opacity-40" />
        </div>

        <div className="text-center">
          <p className="text-base font-semibold text-white/90">
            {dragging ? 'Drop here!' : mode === 'image' ? 'Upload image of notes' : 'Upload PDF document'}
          </p>
          <p className="text-sm text-white/40 mt-1">
            {mode === 'image'
              ? 'PNG, JPG, HEIC, WEBP — handwritten, typed or printed'
              : 'PDF text documents, lecture slides, textbooks'}
          </p>
        </div>

        {mode === 'image' && (
          <div className="flex flex-wrap justify-center gap-1.5 text-xs text-white/25">
            {['Handwritten', 'Typed', 'Printed', 'Slides', 'Whiteboard'].map(t => (
              <span key={t} className="px-2 py-0.5 rounded-md bg-white/5">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabBar({ mode, onChange, disabled }: { mode: InputMode; onChange: (m: InputMode) => void; disabled?: boolean }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-surface-800/60 border border-white/5">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => !disabled && onChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200
            ${mode === tab.id
              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
              : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
