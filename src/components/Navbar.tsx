import { Zap, Key, ExternalLink } from 'lucide-react';

interface NavbarProps {
  hasApiKey: boolean;
  onApiKeyClick: () => void;
}

export default function Navbar({ hasApiKey, onApiKeyClick }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-glow-sm">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-white text-lg tracking-tight">
              Snap<span className="gradient-text">Study</span>
            </span>
            <span className="hidden sm:block px-1.5 py-0.5 text-[10px] font-semibold bg-brand-500/20 text-brand-400 rounded-md border border-brand-500/30">
              AI
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onApiKeyClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                hasApiKey
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                  : 'glass text-white/60 hover:text-white hover:bg-white/8'
              }`}
            >
              <Key size={12} />
              {hasApiKey ? 'API Key ✓' : 'Add API Key'}
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs font-medium text-white/50 hover:text-white transition-colors"
            >
              <ExternalLink size={13} />
              GitHub
            </a>
          </div>
        </div>
      </div>
      {/* Bottom border blur */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-0 -z-10 bg-surface-900/80 backdrop-blur-xl" />
    </nav>
  );
}
