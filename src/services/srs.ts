// Spaced Repetition System — SM-2 algorithm
// Stores deck data in localStorage for persistence across sessions

export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface SRSCard {
  id: string;
  question: string;
  answer: string;
  // SM-2 fields
  interval: number;       // days until next review
  easeFactor: number;     // 1.3–3.0, default 2.5
  repetitions: number;    // consecutive successful reviews
  dueDate: string;        // ISO string
  lapses: number;         // times rated 'again'
  lastRating: SRSRating | null;
}

export interface Deck {
  id: string;
  topic: string;
  summary: string;
  createdAt: string;
  cards: SRSCard[];
}

const STORAGE_KEY = 'snapstudy_decks';

// ── SM-2 Algorithm ────────────────────────────────────────────────────────────

const RATING_SCORE: Record<SRSRating, number> = {
  again: 0,
  hard: 1,
  good: 3,
  easy: 5,
};

export function updateCardSRS(card: SRSCard, rating: SRSRating): SRSCard {
  const q = RATING_SCORE[rating];
  const now = Date.now();
  let { interval, easeFactor, repetitions, lapses } = card;

  if (q < 2) {
    // Failed — reset
    repetitions = 0;
    interval = 1;
    lapses++;
  } else {
    // Successful
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
  }

  // Update ease factor (clamped 1.3–3.0)
  easeFactor = Math.max(1.3, Math.min(3.0,
    easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  ));

  const dueDate = new Date(now + interval * 24 * 60 * 60 * 1000).toISOString();

  return { ...card, interval, easeFactor, repetitions, lapses, dueDate, lastRating: rating };
}

export function isDue(card: SRSCard): boolean {
  return new Date(card.dueDate) <= new Date();
}

export function getDueCards(deck: Deck): SRSCard[] {
  return deck.cards.filter(isDue);
}

export function getNewCards(deck: Deck): SRSCard[] {
  return deck.cards.filter(c => c.repetitions === 0);
}

// ── Storage ───────────────────────────────────────────────────────────────────

export function loadDecks(): Deck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDeck(deck: Deck): void {
  const decks = loadDecks();
  const idx = decks.findIndex(d => d.id === deck.id);
  if (idx >= 0) decks[idx] = deck;
  else decks.unshift(deck);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
}

export function loadDeck(id: string): Deck | null {
  return loadDecks().find(d => d.id === id) ?? null;
}

export function deleteDeck(id: string): void {
  const decks = loadDecks().filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createDeck(
  topic: string,
  summary: string,
  cards: { question: string; answer: string }[]
): Deck {
  const now = new Date().toISOString();
  return {
    id: `deck-${Date.now()}`,
    topic,
    summary,
    createdAt: now,
    cards: cards.map((c, i) => ({
      id: `card-${i}-${Date.now()}`,
      question: c.question,
      answer: c.answer,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      dueDate: now, // due immediately
      lapses: 0,
      lastRating: null,
    })),
  };
}

// ── Stats helpers ─────────────────────────────────────────────────────────────

export interface DeckStats {
  total: number;
  due: number;
  new: number;
  learning: number;  // repetitions > 0 but interval < 21
  mastered: number;  // interval >= 21
}

export function getDeckStats(deck: Deck): DeckStats {
  const total = deck.cards.length;
  const due = getDueCards(deck).length;
  const newCards = getNewCards(deck).length;
  const mastered = deck.cards.filter(c => c.interval >= 21).length;
  const learning = total - newCards - mastered;
  return { total, due, new: newCards, learning, mastered };
}
