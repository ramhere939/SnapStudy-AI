import { useState, useCallback, useRef } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  selectedFile?: File | null;
  previewUrl?: string | null;
  onClear?: () => void;
}

export default function UploadZone({ onFileSelect, disabled, selectedFile, previewUrl, onClear }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  }, [onFileSelect, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  }, [onFileSelect]);

  if (selectedFile && previewUrl) {
    return (
      <div className="relative rounded-2xl overflow-hidden glass border border-white/10 group">
        <img
          src={previewUrl}
          alt="Preview"
          className="w-full max-h-80 object-contain bg-surface-800"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-900/80 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <ImageIcon size={14} className="text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white truncate max-w-[200px]">{selectedFile.name}</p>
              <p className="text-xs text-white/50">{(selectedFile.size / 1024).toFixed(0)} KB</p>
            </div>
          </div>
          {onClear && !disabled && (
            <button
              onClick={onClear}
              className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:bg-red-500/20 transition-colors"
              title="Remove image"
            >
              <X size={14} className="text-white/70" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl
        border-2 border-dashed cursor-pointer transition-all duration-300 select-none
        ${isDragging
          ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
          : 'border-white/10 hover:border-brand-500/50 hover:bg-brand-500/5'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Animated upload icon */}
      <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
        ${isDragging ? 'bg-brand-500/30 scale-110' : 'bg-brand-500/15'}
      `}>
        <Upload
          size={28}
          className={`transition-all duration-300 ${isDragging ? 'text-brand-300 -translate-y-1' : 'text-brand-400'}`}
        />
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-2xl border border-brand-500/30 animate-ping opacity-50" />
      </div>

      <div className="text-center">
        <p className="text-base font-semibold text-white/90">
          {isDragging ? 'Drop your notes here' : 'Upload your study notes'}
        </p>
        <p className="text-sm text-white/40 mt-1">
          Drag & drop or click · PNG, JPG, HEIC, WEBP
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-white/30">
        <span className="px-2 py-1 rounded-md bg-white/5">Handwritten</span>
        <span className="px-2 py-1 rounded-md bg-white/5">Typed</span>
        <span className="px-2 py-1 rounded-md bg-white/5">Printed</span>
        <span className="px-2 py-1 rounded-md bg-white/5">Slides</span>
      </div>
    </div>
  );
}
