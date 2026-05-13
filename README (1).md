# Visual RAG Pipeline 🔍

A full-stack **Retrieval-Augmented Generation (RAG)** application that lets you upload PDF documents and ask questions about them in natural language. Responses include **cited page references** and **relevant images** extracted directly from the PDF — with zero hallucination since the LLM is restricted to only use retrieved document context.

---

## Features

- 📄 **PDF Ingestion** — Upload any multi-page PDF; text and images are extracted and indexed automatically
- 🔍 **Semantic Search** — Questions are matched to the most relevant chunks using vector embeddings
- 🖼️ **Visual Retrieval** — Images associated with retrieved text are displayed alongside the answer
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

This is the core innovation of the pipeline. Here is exactly how text chunks are associated with images:

### Extraction
Using **PyMuPDF**, each page of the PDF is parsed to extract:
1. **Text blocks** — each block includes its text content and a bounding box `[x0, y0, x1, y1]` representing its position on the page
2. **Images** — each image is extracted with its bounding box and saved as a PNG file to disk

### Association Logic
For every text block on a page, we check every image on the same page and measure the **vertical distance** between their bounding boxes:

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

If an image's bounding box is within **150 pixels vertically** of a text block (either above or below), it is considered **associated** with that text chunk.

### Storage
Each text chunk is stored in ChromaDB with its associated image file paths in the metadata:

```
chunk metadata = {
    pdf_id:      "uuid",
    page:        3,
    text:        "Figure 2 shows the architecture...",
    image_paths: "/storage/uuid_p3_img0.png,/storage/uuid_p3_img1.png"
}
```

### Retrieval
At query time:
1. The query is embedded and the top-K most semantically similar chunks are retrieved
2. Each retrieved chunk's `image_paths` metadata is unpacked
3. Unique images from all retrieved chunks are returned alongside the text answer

### Why This Works
This strategy captures the standard document layout pattern where figures appear immediately above or below their caption/description text. A 150px threshold works well for most academic papers, technical manuals, and reports — covering both figures with captions directly below and inline figures embedded within paragraphs.

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
│   ├── .env.example       # Template for required environment variables
│   ├── storage/           # Extracted PDF images (auto-created)
│   └── chroma_data/       # ChromaDB persistence (auto-created)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── Sidebar.jsx      # PDF list + upload zone
│   │       ├── ChatPanel.jsx    # Chat interface + citations
│   │       ├── ImagePanel.jsx   # Retrieved images display
│   │       └── UploadZone.jsx   # Drag and drop uploader
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

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

### Query request body
```json
{
  "query": "What is the methodology used?",
  "pdf_id": "optional-uuid-to-search-only-one-pdf"
}
```

### Query response
```json
{
  "answer": "The methodology uses... [Page 4]",
  "citations": [{"page": 4, "pdf_id": "uuid"}],
  "images": ["/images/uuid_p4_img0.png"]
}
```

---

## Setup & Deployment

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- A free [Groq API key](https://console.groq.com)
- A free [Google AI Studio API key](https://aistudio.google.com)

### Step 1 — Clone the repository

```bash
git clone https://github.com/NAMANSUYAL17/visual-rag.git
cd visual-rag
```

### Step 2 — Create your `.env` file

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in your keys:

```env
GROQ_API_KEY=gsk_your_groq_key_here
GOOGLE_API_KEY=AIza_your_google_key_here
```

### Step 3 — Build and run with Docker

```bash
docker-compose up --build
```

First build takes 5-10 minutes. Once complete, open:

- **App:** http://localhost:3000
- **API docs:** http://localhost:8000/docs

---

## Running Without Docker (Development)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file
cp .env.example .env
# Fill in GROQ_API_KEY and GOOGLE_API_KEY

# Start backend
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
# Open a new terminal
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

---

## How to Use

1. **Start both servers** (Docker or manual)
2. **Open** http://localhost:3000 in your browser
3. **Upload a PDF** by dragging it into the left panel or clicking the upload zone
4. **Wait** for the green dot to appear next to the PDF name (ingestion complete)
5. **Click the PDF name** to scope your search to that document (or leave unselected to search all)
6. **Type a question** in the chat box and press Enter
7. **Read the answer** with page citations on the left and related images on the right
8. **Click a citation** (e.g. "Page 4") to open that page in the PDF viewer
9. **Delete a PDF** by clicking the × button next to its name

---

## Environment Variables

| Variable | Description | Where to get it |
|---|---|---|
| `GROQ_API_KEY` | Groq LLM API key | [console.groq.com](https://console.groq.com) |
| `GOOGLE_API_KEY` | Google Gemini embedding key | [aistudio.google.com](https://aistudio.google.com) |

---

## Free Tier Limits

| Service | Free Limit |
|---|---|
| Groq `llama-3.3-70b-versatile` | 14,400 requests/day |
| Google `gemini-embedding-001` | 1,500 requests/day |
| ChromaDB (local) | Unlimited |

A typical 30-page PDF uses ~30–90 embedding calls during ingestion, leaving plenty of headroom on the free tier.

---

## Docker Commands Reference

```bash
# Start everything
docker-compose up

# Start in background
docker-compose up -d

# Stop everything
docker-compose down

# Rebuild after code changes
docker-compose up --build

# View backend logs
docker-compose logs backend

# View frontend logs
docker-compose logs frontend

# Full reset (deletes volumes too)
docker-compose down -v
```

---

## License

MIT
