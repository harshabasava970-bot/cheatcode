# CheatCode — AI Interview Practice Assistant

An AI-powered full-stack interview practice tool for B.Tech students. Speak your interview question, get expert AI answers instantly.

## Features

- 🎤 **Speech-to-Text** — Browser Web Speech API with real-time transcription
- ⏱️ **Silence Detection** — Auto-submits after 2 seconds of silence
- 🤖 **AI Answers** — GPT-4o-mini generates structured interview answers
- 📋 **4 Answer Formats** — Direct, Key Points, 30-sec version, Detailed + Follow-ups
- 📚 **History** — Save, tag weak/strong, generate revision notes
- 📊 **Stats** — Track practice progress by category
- 🌙 **Dark Mode** — Clean dark UI with light mode toggle
- ✍️ **Manual Input** — Type questions if speech isn't available

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **AI**: OpenAI GPT-4o-mini
- **Speech**: Web Speech API (Chrome/Edge)

## Setup

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env and add your OpenAI API key
```

Your `.env` file:
```
OPENAI_API_KEY=sk-...your-key-here...
PORT=5000
```

### 3. Run

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open http://localhost:5173

## Usage

1. Click **Start Microphone** (allow mic access when prompted)
2. **Ask your interview question** clearly
3. **Stay silent for 2 seconds** — it auto-submits
4. View the **AI answer** with 5 different formats
5. **Mark questions** as Weak/Strong in history
6. **Save revision notes** for important topics

## Supported Topics

| Category | Examples |
|----------|---------|
| DSA | Arrays, Trees, Graphs, DP, Sorting |
| OOP | Inheritance, Polymorphism, SOLID |
| DBMS | SQL, Normalization, Transactions |
| OS | Processes, Threads, Memory Mgmt |
| CN | TCP/IP, HTTP, DNS, Load Balancing |
| Web Dev | REST APIs, React, Node.js |
| System Design | Scalability, Caching, Microservices |
| HR | Strengths, Tell me about yourself |
| AI/ML | Neural Nets, Overfitting, CNNs |

## Browser Support

Speech recognition requires **Chrome** or **Edge** (desktop). Manual text input works in all browsers.
