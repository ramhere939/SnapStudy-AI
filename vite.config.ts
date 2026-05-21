import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('@google/genai')) {
            return 'gemini-sdk';
          }
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          if (id.includes('tesseract')) {
            return 'ocr';
          }
        },
      },
    },
  },
});
