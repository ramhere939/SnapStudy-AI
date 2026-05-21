// PDF text extraction using pdfjs-dist with local bundled worker

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import('pdfjs-dist');
  // Use locally bundled worker (copied to /public) — avoids CDN failures
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  return pdfjsLib;
}

export async function extractTextFromPdf(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const lib = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = lib.getDocument({ data: arrayBuffer });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const texts: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim();
    if (pageText) texts.push(pageText);
    onProgress?.(Math.round((i / numPages) * 100));
  }

  const fullText = texts.join('\n\n').replace(/\s{3,}/g, ' ').trim();

  if (!fullText || fullText.length < 20) {
    throw new Error(
      'Could not extract text from this PDF. It may be a scanned/image-based PDF.\n' +
      'Tip: Try uploading a photo of the PDF pages using the Image tab instead.'
    );
  }

  return fullText;
}
