# Visual RAG Pipeline 🔍

A full-stack **Retrieval-Augmented Generation (RAG)** application that lets you upload PDF documents and ask questions in natural language. Responses include **cited page references** and **relevant images** extracted directly from the PDF — with zero hallucination since the LLM is restricted to only use retrieved document context.

---

## Features

- 📄 **PDF Ingestion** — Upload any multi-page PDF; text and images are extracted and indexed automatically
- 🔍 **Semantic Search** — Questions are matched to the most relevant chunks using vector embeddings
- 🖼️ **Visual Retrieval** — Images associated with retrieved text are shown alongside the answer
- 📌 **Page Citations** — Every answer includes clickable page number citations
- 🚫 **Hallucination Control** — LLM is strictly prompted to answer only from retrieved context
- 🗑️ **PDF Management** — Delete PDFs including all vectors and extracted images
- ⚡ **Async Ingestion** — PDF upload returns immediately; ingestion runs in the background

---

## Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| LLM | Groq — `llama-3.3-70b-versatile` | Free tier |
| Embeddings | Google — `gemini-embedding-001` | Free tier |
| Vector DB | ChromaDB (local) | Free / self-hosted |
| PDF Parsing | PyMuPDF (fitz) | Open source |
| Backend | FastAPI + Python 3.11 | Open source |
| Frontend | React + Vite | Open source |
| Container | Docker + Docker Compose | Free |

---

## Text-to-Image Mapping Strategy

Using **PyMuPDF**, each PDF page is parsed to extract text blocks and images, each with bounding boxes. For every text block, we measure the vertical distance to every image on the same page:

```python
def find_nearby_images(text_bbox, images, threshold=150):
    tx0, ty0, tx1, ty1 = text_bbox
    nearby = []
    for img in images:
        ix0, iy0, ix1, iy1 = img["bbox"]
        vertical_gap = min(abs(ty0 - iy1), abs(iy0 - ty1))
        if vertical_gap < threshold:
            nearby.append(img)
    return nearby
```

If an image is within **150 pixels vertically** of a text block, it is stored in that chunk's metadata. At query time, retrieved chunks automatically surface their linked images alongside the text answer.

---

## Project Structure

```
visual-rag/
├── backend/
│   ├── main.py            # FastAPI app — all API endpoints
│   ├── ingest.py          # PDF parsing, text + image extraction
│   ├── embed.py           # Google embeddings + ChromaDB operations
│   ├── retrieve.py        # Semantic search wrapper
│   ├── generate.py        # Groq LLM call with hallucination control
│   ├── config.py          # Settings via pydantic-settings
│   ├── models.py          # Pydantic request/response schemas
│   ├── requirements.txt   # Python dependencies
│   ├── Dockerfile
│   └── .env.example       # Template for required environment variables
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── Sidebar.jsx
│   │       ├── ChatPanel.jsx
│   │       ├── ImagePanel.jsx
│   │       └── UploadZone.jsx
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — for Docker setup
- [Python 3.11+](https://www.python.org/downloads/) — for manual setup
- [Node.js 20+](https://nodejs.org/) — for manual setup
- Free [Groq API key](https://console.groq.com)
- Free [Google AI Studio API key](https://aistudio.google.com)

---

## Getting API Keys

### Groq API Key (Free)
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up — no credit card needed
3. Left sidebar → **API Keys** → **Create API Key**
4. Copy the key — starts with `gsk_...`

### Google API Key (Free)
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **Get API Key** → **Create API key in new project**
4. Copy the key — starts with `AIza...`

---

## Installation

### Option A — Docker (Recommended)

**Step 1 — Clone the repository**
```bash
git clone https://github.com/NAMANSUYAL17/visual-rag.git
cd visual-rag
```

**Step 2 — Create your `.env` file**
```bash
# Windows
copy backend\.env.example backend\.env

# Mac/Linux
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in your keys:
```env
GROQ_API_KEY=gsk_your_groq_key_here
GOOGLE_API_KEY=AIza_your_google_key_here
```

**Step 3 — Start Docker Desktop**

Open Docker Desktop and wait until it shows **Engine running**.

**Step 4 — Build and run**
```bash
docker-compose up --build
```

First build takes 5-10 minutes. Once complete:
- **App:** http://localhost:3000
- **API docs:** http://localhost:8000/docs

---

### Option B — Manual Setup (Without Docker)

**Step 1 — Clone the repository**
```bash
git clone https://github.com/NAMANSUYAL17/visual-rag.git
cd visual-rag
```

**Step 2 — Backend setup**
```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Step 3 — Create `.env` file**
```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

Add your keys to `backend/.env`:
```env
GROQ_API_KEY=gsk_your_groq_key_here
GOOGLE_API_KEY=AIza_your_google_key_here
```

**Step 4 — Start the backend**
```bash
uvicorn main:app --reload --port 8000
```

**Step 5 — Frontend setup (new terminal)**
```bash
cd frontend
npm install
npm run dev
```

**Step 6 — Open the app**

Go to http://localhost:3000

---

## How to Use

1. **Upload a PDF** — drag it into the left panel or click the upload zone
2. **Wait** for the green dot next to the PDF name (ingestion complete)
3. **Click the PDF name** to search only that document (or leave unselected for all)
4. **Type a question** in the chat box and press **Enter**
5. **Read the answer** with page citations on the left, images on the right
6. **Delete a PDF** by clicking **×** next to its name

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/ingest` | Upload a PDF for ingestion |
| `GET` | `/status/{pdf_id}` | Check ingestion status |
| `GET` | `/pdfs` | List all ingested PDFs |
| `POST` | `/query` | Ask a question |
| `DELETE` | `/pdf/{pdf_id}` | Delete a PDF and all its data |

**Query request:**
```json
{
  "query": "What is the methodology used?",
  "pdf_id": "optional-uuid-to-search-one-pdf"
}
```

**Query response:**
```json
{
  "answer": "The methodology uses... [Page 4]",
  "citations": [{"page": 4, "pdf_id": "uuid"}],
  "images": ["/images/uuid_p4_img0.png"]
}
```

---

## Docker Commands

```bash
docker-compose up           # Start
docker-compose up -d        # Start in background
docker-compose down         # Stop
docker-compose up --build   # Rebuild after code changes
docker-compose logs backend # Backend logs
docker-compose logs frontend # Frontend logs
docker-compose down -v      # Full reset
```

---

## Free Tier Limits

| Service | Free Limit |
|---|---|
| Groq `llama-3.3-70b-versatile` | 14,400 req/day |
| Google `gemini-embedding-001` | 1,500 req/day |
| ChromaDB (local) | Unlimited |

---

## Troubleshooting

**Backend won't start** — Make sure venv is activated and `backend/.env` has both keys filled in.

**"Something went wrong" on query** — Check uvicorn terminal for the full traceback. Make sure at least one PDF shows a green dot before querying.

**Docker build fails** — Run `docker builder prune -f` then `docker-compose up --build`.

**Google API SSL error** — Try on a different network or mobile hotspot.

---

## License

MIT
