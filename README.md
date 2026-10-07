# 🧠 Atlas — Personal Life Operating System

> **Your local-first, AI-powered memory for everything digital.**

Atlas indexes your files, browser history, messages, email, and code — then lets you ask anything in natural language. **All data stays on your machine. Zero cloud.**

---

## ✨ Features

| Feature | Status |
|---------|--------|
| 🔍 **Semantic Search** — find by meaning, not keywords | ✅ v0.1 |
| 📄 **File Ingestion** — PDF, DOCX, code, markdown, text | ✅ v0.1 |
| 🌐 **Browser History** — Chrome, Edge, Brave | ✅ v0.1 |
| 🧠 **Local LLM** — Ollama (Llama 3.2, Mistral, etc.) | ✅ v0.1 |
| 🎨 **3D Knowledge Graph** — Three.js interactive visualization | ✅ v0.1 |
| 🔒 **Fully Offline** — no data ever leaves your machine | ✅ v0.1 |
| 📧 Email Ingestion | 🔜 v0.2 |
| 🤖 Autonomous Agents | 🔜 v0.2 |

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Ollama** (for local LLM) — [install guide](https://ollama.ai)

### 1. Clone & Setup

```bash
git clone https://github.com/Swayamjain1240/Atlas.git
cd Atlas

# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env   # Edit .env with your API key

# Pull a local LLM
ollama pull llama3.2:3b

# Start the server
python -m src.main
```

### 2. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Open Atlas

Navigate to **http://localhost:5173**

Set your API key in Settings (found in `backend/.env` or server startup output).

---

## 🏗️ Architecture

```
atlas/
├── backend/                    # Python + FastAPI
│   ├── src/
│   │   ├── main.py            # Server entry + routes
│   │   ├── config.py          # Env validation + config
│   │   ├── security.py        # Auth, CORS, rate limit, sanitization
│   │   ├── api/               # API routes & response models
│   │   │   ├── __init__.py    # Response helpers
│   │   │   └── routes.py      # REST endpoints
│   │   └── ai/                # AI Engine (RAG)
│   │       └── engine.py      # Embedding, retrieval, generation
│   ├── ingestion/             # Data ingestion pipeline
│   │   ├── file_ingestor.py   # File system watcher
│   │   └── browser_ingestor.py# Chrome history reader
│   └── requirements.txt
│
├── frontend/                   # React + Vite + Tailwind
│   ├── src/
│   │   ├── App.jsx            # Root layout
│   │   ├── components/
│   │   │   ├── Chat.jsx       # Chat interface
│   │   │   ├── Dashboard.jsx  # Stats & controls
│   │   │   ├── Timeline.jsx   # History view
│   │   │   ├── Graph3D.jsx    # 3D knowledge graph
│   │   │   ├── Header.jsx     # Top bar
│   │   │   ├── Sidebar.jsx    # Navigation
│   │   │   └── Settings.jsx   # API key & config
│   │   └── styles/globals.css
│   └── package.json
│
├── docs/                       # Documentation
│   ├── atlas_architecture.pdf
│   ├── atlas_system_design.pdf
│   └── atlas_requirements.pdf
│
├── .env.example                # Environment template
├── .gitignore
└── README.md
```

---

## 🔒 Security

| Measure | Implementation |
|---------|---------------|
| **API Key Auth** | Bearer token in Authorization header |
| **Input Sanitization** | XSS patterns blocked, length limits |
| **CORS** | Restricted to localhost only |
| **Rate Limiting** | 100 requests/minute per IP |
| **Security Headers** | CSP, X-Frame-Options, HSTS, etc. |
| **Secret Scanning** | Pre-commit hook checks for exposed keys |
| **Local-First** | No data sent to external services |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python, FastAPI, Uvicorn |
| **AI/ML** | Sentence-Transformers, ChromaDB, Ollama |
| **Frontend** | React 18, Vite, Tailwind CSS, Three.js |
| **Storage** | ChromaDB (vectors), SQLite (metadata) |

---

## 📄 License

MIT License — see LICENSE for details.
