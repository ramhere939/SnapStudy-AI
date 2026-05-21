import { GoogleGenAI } from '@google/genai';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface StudySet {
  flashcards: Flashcard[];
  summary: string;
  topic: string;
}

/**
 * Model priority list — newest/best first, fallback to older on 404.
 * All are free-tier eligible on AI Studio keys.
 */
const MODEL_CHAIN = [
  'gemini-3.5-flash',          // GA, most capable Flash (May 2026 docs)
  'gemini-2.5-flash-preview-05-20', // Preview, still widely available
  'gemini-2.0-flash',          // Stable fallback
  'gemini-2.0-flash-lite',     // Lightest, most quota-friendly
];

const SYSTEM_PROMPT = `You are an expert educational content creator specializing in active recall techniques.
Given raw study notes (possibly from OCR), extract the key concepts and generate a structured study set.

Return your response as STRICT valid JSON with this exact structure:
{
  "topic": "Short topic name (2-5 words)",
  "summary": "A concise 2-3 sentence summary of the content",
  "flashcards": [
    { "question": "Clear, specific question", "answer": "Concise, memorable answer" }
  ]
}

Rules:
- Generate exactly 5 high-quality flashcards
- Questions must test understanding, not just recall
- Answers must be concise (1-3 sentences max)
- Focus on the most important concepts
- Gracefully handle OCR noise or typos
- ONLY return valid JSON — no markdown fences, no explanation`;

// ── Error types ───────────────────────────────────────────────────────────────

export type GeminiErrorKind =
  | 'zero_quota'      // limit: 0 — project not provisioned (key config issue)
  | 'quota_exhausted' // 429 — used up quota, retry after wait
  | 'auth'            // bad API key
  | 'not_found'       // model 404
  | 'parse'           // bad JSON from model
  | 'unknown';

export class GeminiError extends Error {
  kind: GeminiErrorKind;
  retryAfterSeconds: number | null;

  constructor(kind: GeminiErrorKind, message: string, retryAfterSeconds: number | null = null) {
    super(message);
    this.kind = kind;
    this.retryAfterSeconds = retryAfterSeconds;
    this.name = 'GeminiError';
  }
}

// ── Error classification ──────────────────────────────────────────────────────

function isZeroQuota(msg: string): boolean {
  // "limit": 0 or limit: 0 in the raw API error JSON
  return /["']?limit["']?\s*:\s*0\b/.test(msg) || msg.includes('"limit": 0') || msg.includes('"limit":0');
}

function parseRetrySeconds(msg: string): number | null {
  const patterns = [
    /retryDelay["']?\s*:\s*["'](\d+(?:\.\d+)?)s/i,
    /Please retry in (\d+(?:\.\d+)?)s/i,
    /retry after (\d+(?:\.\d+)?)\s*s/i,
    /(\d+(?:\.\d+)?)\s*s\b/i,
  ];
  for (const p of patterns) {
    const m = msg.match(p);
    if (m) return Math.ceil(parseFloat(m[1]));
  }
  return null;
}

export function extractRetrySeconds(err: unknown): number | null {
  return parseRetrySeconds(err instanceof Error ? err.message : String(err));
}

function classify(err: unknown): { kind: GeminiErrorKind; retryAfterSeconds: number | null } {
  const raw = err instanceof Error ? err.message : String(err);
  const msg = raw.toLowerCase();

  if (isZeroQuota(raw)) {
    return { kind: 'zero_quota', retryAfterSeconds: null };
  }
  if (msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('toomanyrequests') || msg.includes('quota')) {
    return { kind: 'quota_exhausted', retryAfterSeconds: parseRetrySeconds(raw) };
  }
  if (msg.includes('api_key_invalid') || msg.includes('401') || msg.includes('invalid api key') || msg.includes('api key not valid')) {
    return { kind: 'auth', retryAfterSeconds: null };
  }
  if (msg.includes('404') || msg.includes('not found') || msg.includes('is not found for api version')) {
    return { kind: 'not_found', retryAfterSeconds: null };
  }
  return { kind: 'unknown', retryAfterSeconds: null };
}

function buildFriendlyError(kind: GeminiErrorKind, retryAfterSeconds: number | null): GeminiError {
  switch (kind) {
    case 'zero_quota':
      return new GeminiError(
        'zero_quota',
        [
          'Your project has no free quota provisioned (API returned limit: 0).',
          'This happens when billing is attached to the Google Cloud project, or you\'re on a Workspace account.',
          'Fix: get a fresh key from aistudio.google.com/app/apikey using a personal Gmail on a new project.',
        ].join('\n'),
        null
      );
    case 'quota_exhausted': {
      const wait = retryAfterSeconds ? ` Please wait ${retryAfterSeconds} seconds.` : ' Please wait a moment.';
      return new GeminiError(
        'quota_exhausted',
        `Free tier rate limit hit.${wait}\n\nOr use a fresh key from aistudio.google.com/app/apikey — each new project gets full free quota.`,
        retryAfterSeconds
      );
    }
    case 'auth':
      return new GeminiError('auth', 'Invalid API key. Please re-enter your key via the "API Key" button.', null);
    case 'not_found':
      return new GeminiError('not_found', 'None of the Gemini models were available for your API key.\n\nEnsure your key is from aistudio.google.com (not the Cloud Console).', null);
    default:
      return new GeminiError('unknown', 'An unexpected error occurred. Please try again.', null);
  }
}

// ── Priority: which error kind matters most ───────────────────────────────────
const KIND_PRIORITY: Record<GeminiErrorKind, number> = {
  zero_quota: 5, auth: 4, quota_exhausted: 3, parse: 2, not_found: 1, unknown: 0,
};

// ── Core generate function (new @google/genai SDK) ────────────────────────────
async function tryGenerate(apiKey: string, prompt: string, model: string): Promise<string> {
  // Use the new SDK: GoogleGenAI from @google/genai
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  // New SDK: response.text is a property, not a function
  const text = response.text;
  if (!text) throw new Error('Empty response from model.');
  return text;
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function generateStudySet(extractedText: string, apiKey: string): Promise<StudySet> {
  if (!apiKey) {
    throw new GeminiError('auth', 'No API key set. Click "Add API Key" in the top navbar.');
  }

  const prompt = `${SYSTEM_PROMPT}\n\nNotes to process:\n"""\n${extractedText}\n"""`;

  let bestKind: GeminiErrorKind = 'unknown';
  let bestRetry: number | null = null;

  for (const model of MODEL_CHAIN) {
    try {
      const text = await tryGenerate(apiKey, prompt, model);
      const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let parsed: { topic?: string; summary?: string; flashcards?: { question: string; answer: string }[] };
      try {
        parsed = JSON.parse(clean);
      } catch {
        // If JSON parse fails, try to extract JSON from the response
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new GeminiError('parse', 'AI returned unreadable output. Please try again.');
        parsed = JSON.parse(jsonMatch[0]);
      }

      return {
        topic: parsed.topic || 'Study Set',
        summary: parsed.summary || '',
        flashcards: (parsed.flashcards || []).map(
          (fc, i) => ({ id: `fc-${i}`, question: fc.question, answer: fc.answer })
        ),
      };

    } catch (err) {
      // Surface our own typed errors immediately if terminal
      if (err instanceof GeminiError) {
        if (err.kind === 'parse' || err.kind === 'auth') throw err;
        if (KIND_PRIORITY[err.kind] > KIND_PRIORITY[bestKind]) {
          bestKind = err.kind; bestRetry = err.retryAfterSeconds;
        }
        // zero_quota & auth: no point trying other models on same key
        if (err.kind === 'zero_quota') break;
        continue;
      }

      const { kind, retryAfterSeconds } = classify(err);
      if (KIND_PRIORITY[kind] > KIND_PRIORITY[bestKind]) {
        bestKind = kind; bestRetry = retryAfterSeconds;
      }

      // Stop chain for terminal errors
      if (kind === 'auth' || kind === 'zero_quota') break;
      // Continue to next model for not_found or quota
    }
  }

  throw buildFriendlyError(bestKind, bestRetry);
}
