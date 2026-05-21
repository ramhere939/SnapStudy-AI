# SnapStudy AI ⚡

> **Turn handwritten or typed study notes into smart AI-generated flashcards in seconds.**

Built for the **Gemini API Hackathon** — a polished, fully-functional MVP combining Tesseract OCR with Google Gemini 1.5 Flash.

![SnapStudy AI](./public/favicon.svg)

---

## 🚀 Live Demo

> Deploy to Vercel in one click — see [Deployment](#deployment) below.

---

## ✨ Features

- 📸 **Drag & Drop Upload** — Accepts any handwritten, typed, or printed notes image
- 🔍 **OCR Text Extraction** — Tesseract.js reads text directly in the browser (no upload to servers)
- 🤖 **Gemini AI Processing** — Gemini 1.5 Flash understands your notes and generates structured content
- 🃏 **Interactive 3D Flashcards** — 5 targeted Q&A flashcards with a satisfying flip animation
- 📝 **AI Summary** — Concise overview of the material with topic detection
- 🔒 **Privacy-first** — Everything runs client-side; your notes never leave your browser
- 📱 **Mobile Responsive** — Works beautifully on phone, tablet, and desktop

---

## 🏗️ Architecture

```
snapstudy-ai/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx          # Top navigation with API key status
│   │   ├── UploadZone.tsx      # Drag-and-drop image uploader
│   │   ├── LoadingState.tsx    # Animated step-by-step progress
│   │   ├── Flashcard.tsx       # 3D flip flashcard components
│   │   ├── SummaryCard.tsx     # AI-generated topic summary
│   │   └── ApiKeyModal.tsx     # Secure API key entry modal
│   ├── services/
│   │   ├── gemini.ts           # Gemini 1.5 Flash integration & prompt engineering
│   │   └── ocr.ts              # Tesseract.js OCR wrapper
│   ├── App.tsx                 # Main orchestration component
│   ├── main.tsx                # React entry point
│   └── index.css               # Global styles + Tailwind layers
├── index.html
├── tailwind.config.js
└── vite.config.ts
```

### Data Flow

```
Image Upload → Tesseract OCR → Raw Text → Gemini 1.5 Flash → Structured JSON → UI Rendering
```

---

## 🔧 Setup & Development

### Prerequisites

- Node.js 18+
- A [Gemini API key](https://aistudio.google.com/app/apikey) (free)

### Installation

```bash
git clone https://github.com/yourusername/snapstudy-ai.git
cd snapstudy-ai
npm install
npm run dev
```

### API Key Configuration

**Option 1 — In-app (recommended for demo):**
Click "Add API Key" in the navbar and paste your key. It's stored in `sessionStorage` only.

**Option 2 — Environment variable:**
```bash
# .env.local
VITE_GEMINI_API_KEY=your_api_key_here
```

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

Set `VITE_GEMINI_API_KEY` in Vercel's environment variables dashboard.

### Netlify

```bash
npm run build
# Upload the `dist/` folder to Netlify Drop
```

---

## 🎯 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS v3 |
| AI Model | Google Gemini 1.5 Flash |
| OCR | Tesseract.js |
| Icons | Lucide React |
| Fonts | Inter + Plus Jakarta Sans |

---

## 📋 Devpost Summary

**SnapStudy AI** is an AI-powered study tool that transforms any image of notes — handwritten, typed, or printed — into a polished set of interactive flashcards using state-of-the-art AI.

**The Problem:** Students spend hours re-reading notes. Research shows active recall (flashcards) is far more effective, but creating good flashcards takes time nobody has before an exam.

**The Solution:** Snap a photo → AI does the rest. In under 20 seconds, SnapStudy AI:
1. Extracts all text using browser-side OCR (Tesseract.js)
2. Sends it to Gemini 1.5 Flash with a carefully engineered prompt
3. Returns 5 targeted flashcards + a topic summary
4. Displays them as beautiful, interactive 3D flip cards

**What makes it special:**
- 100% client-side — notes never leave the user's device
- Works offline for OCR (Tesseract runs in browser)
- Supports handwritten, messy, or low-quality notes
- Zero friction — no signup, no account, instant results

---

## 📄 License

MIT © 2025 SnapStudy AI
