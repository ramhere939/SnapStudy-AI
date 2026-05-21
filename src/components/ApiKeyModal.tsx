import { useState } from 'react';
import { Key, Eye, EyeOff, ExternalLink, X } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
  onClose: () => void;
  hasKey: boolean;
}

export default function ApiKeyModal({ isOpen, onSave, onClose, hasKey }: ApiKeyModalProps) {
  const [value, setValue] = useState('');
  const [show, setShow] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (value.trim()) {
      onSave(value.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md glass-strong rounded-2xl p-6 shadow-glow-md">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg glass flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <X size={14} className="text-white/60" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <Key size={18} className="text-brand-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Gemini API Key</h2>
            <p className="text-xs text-white/40">{hasKey ? 'Update your key' : 'Required to generate flashcards'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">API Key</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="AIza..."
                className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 transition-all"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="glass rounded-xl p-3 text-xs text-white/40 space-y-1">
            <p>🔒 Your key is stored only in your browser session and never sent to any server.</p>
          </div>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            <ExternalLink size={11} />
            Get a free API key from Google AI Studio
          </a>

          <button
            onClick={handleSave}
            disabled={!value.trim()}
            className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            Save API Key
          </button>
        </div>
      </div>
    </div>
  );
}
