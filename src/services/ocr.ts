import Tesseract from 'tesseract.js';

export interface OcrResult {
  text: string;
  confidence: number;
}

export async function extractTextFromImage(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<OcrResult> {
  const result = await Tesseract.recognize(imageFile, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const text = result.data.text.trim();
  const confidence = result.data.confidence;

  if (!text || text.length < 10) {
    throw new Error('Could not extract meaningful text from the image. Please try a clearer photo.');
  }

  return { text, confidence };
}
