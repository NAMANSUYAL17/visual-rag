# main.py
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, BackgroundTasks, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uuid, shutil, os

from ingest import parse_pdf
from embed import embed_and_store, delete_pdf_vectors
from retrieve import retrieve
from generate import generate_answer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

STORAGE_DIR = "storage"
os.makedirs(STORAGE_DIR, exist_ok=True)

app.mount("/images", StaticFiles(directory=STORAGE_DIR), name="images")

# In-memory registry: { pdf_id: { filename, status, chunk_count } }
pdf_registry = {}


class QueryRequest(BaseModel):
    query: str
    pdf_id: Optional[str] = None


def run_ingestion(pdf_path: str, pdf_id: str, filename: str):
    try:
        pdf_registry[pdf_id]["status"] = "processing"
        chunks = parse_pdf(pdf_path, pdf_id, STORAGE_DIR)
        embed_and_store(chunks)
        pdf_registry[pdf_id]["status"] = "done"
        pdf_registry[pdf_id]["chunk_count"] = len(chunks)
    except Exception as e:
        pdf_registry[pdf_id]["status"] = "error"
        pdf_registry[pdf_id]["detail"] = str(e)
        print(f"Ingestion error for {pdf_id}: {e}")
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)


@app.get("/")
async def root():
    return {"status": "ok", "message": "Visual RAG API running"}


@app.post("/ingest")
async def ingest_pdf(file: UploadFile, background_tasks: BackgroundTasks):
    pdf_id = str(uuid.uuid4())
    tmp_path = f"/tmp/{pdf_id}.pdf"

    # Windows doesn't always have /tmp — use local temp instead
    tmp_path = os.path.join(os.getcwd(), f"tmp_{pdf_id}.pdf")

    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    pdf_registry[pdf_id] = {
        "filename": file.filename,
        "status": "processing",
        "chunk_count": 0
    }

    background_tasks.add_task(run_ingestion, tmp_path, pdf_id, file.filename)
    return {"pdf_id": pdf_id, "filename": file.filename, "status": "processing"}


@app.get("/status/{pdf_id}")
async def get_status(pdf_id: str):
    if pdf_id not in pdf_registry:
        raise HTTPException(status_code=404, detail="PDF not found")
    return {"pdf_id": pdf_id, **pdf_registry[pdf_id]}


@app.get("/pdfs")
async def list_pdfs():
    return {
        "pdfs": [
            {"pdf_id": k, **v}
            for k, v in pdf_registry.items()
        ]
    }


@app.post("/query")
async def query(request: QueryRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    chunks = retrieve(request.query, request.pdf_id)

    if not chunks:
        return {
            "answer": "I couldn't find any relevant information in the uploaded documents.",
            "citations": [],
            "images": []
        }

    result = generate_answer(request.query, chunks)
    return result   # ← just return result directly, not result["answer"]

@app.delete("/pdf/{pdf_id}")
async def delete_pdf(pdf_id: str):
    if pdf_id not in pdf_registry:
        raise HTTPException(status_code=404, detail="PDF not found")

    # Remove vectors from ChromaDB
    try:
        delete_pdf_vectors(pdf_id)
    except Exception as e:
        print(f"Vector deletion error: {e}")

    # Remove extracted images from disk
    removed_images = 0
    for fname in os.listdir(STORAGE_DIR):
        if fname.startswith(pdf_id):
            os.remove(os.path.join(STORAGE_DIR, fname))
            removed_images += 1

    # Remove from registry
    pdf_registry.pop(pdf_id, None)

    return {
        "status": "deleted",
        "pdf_id": pdf_id,
        "images_removed": removed_images
    }