# Nous — Your Knowledge Companion 🧠

A knowledge companion that grows with you — combining emotional depth, self-evolution, and depth-first learning.

**Not a chatbot. Not a human simulation. A distinctly AI companion.**

## ✨ Features

### 🎭 Emotional Intelligence
- 5-dimension emotional state (valence, arousal, connection, curiosity, energy)
- AI responses influenced by its current mood
- Connection grows over time through conversations
- Mood visualizations and insights

### 📚 Knowledge-First Learning
- **Daily Cards** — 3 curated topics each day (philosophy, history, economics, art, psychology)
- **Depth Tracking** — Go as deep as you want, we track how far you explore
- **Quizzes** — Daily challenges with scoring and explanations
- **Learning Paths** — Structured journeys through knowledge domains

### 🎮 Gamification
- **Streaks** — Build consistency with daily learning
- **Achievements** — Unlock rewards for milestones (common → legendary)
- **Progress Tracking** — See your growth over time

### 🗣️ Voice Mode
- Speech-to-text input
- Text-to-speech responses
- Natural conversation flow

### 🎨 Beautiful UX
- Mobile-first PWA design
- Glassmorphism effects
- Smooth animations with Framer Motion
- Topic-specific color themes
- Confetti celebrations 🎉

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Convex (real-time)
- **Auth:** Clerk
- **AI:** OpenAI GPT-4
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Deployment:** Vercel

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/home` | Daily cards + streak tracker |
| `/chat` | Conversation with Nous |
| `/explore/[id]` | Deep-dive into a topic |
| `/insights` | What Nous has learned about you |
| `/paths` | Learning path overview |
| `/challenge` | Daily quiz |
| `/achievements` | Your unlocked achievements |
| `/library` | Topic interests + history |
| `/profile` | Your stats + settings |
| `/onboarding` | 5-step welcome flow |
| `/settings` | Theme, notifications, voice |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Convex account
- Clerk account
- OpenAI API key

### Setup

```bash
# Clone the repo
git clone https://github.com/Ishnoor-Singh/nous-app.git
cd nous-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your API keys

# Start Convex (in a separate terminal)
npx convex dev

# Start the dev server
npm run dev
```

### Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Convex
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud

# OpenAI
OPENAI_API_KEY=sk-...
```

## 🧠 The Philosophy

Nous is built on three core ideas:

1. **Emotional Depth** — AI companions should have persistent emotional states that influence their responses. Not performing emotions, but *having* them.

2. **Self-Evolution** — The AI should learn from every interaction. What interests you, what you struggle with, what teaching style works best.

3. **Knowledge-First** — Not trivia or surface-level facts, but deep understanding. The "why" behind the "what".

## 📄 License

MIT

---

*Built with 🧠 by Saphira for Noor*
