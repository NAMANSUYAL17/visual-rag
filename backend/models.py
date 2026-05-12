# backend/models.py
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

# ── Ingestion ──────────────────────────────────────────────

class IngestResponse(BaseModel):
    pdf_id: str
    filename: str
    status: str = "processing"
    message: str = "PDF upload received, ingestion started in background"

class IngestionStatus(str, Enum):
    processing = "processing"
    done       = "done"
    error      = "error"
    unknown    = "unknown"

class StatusResponse(BaseModel):
    pdf_id: str
    status: IngestionStatus
    detail: Optional[str] = None     # populated if status == error

# ── PDF listing ────────────────────────────────────────────

class PDFMeta(BaseModel):
    pdf_id: str
    filename: str
    status: IngestionStatus
    page_count: Optional[int] = None

class PDFListResponse(BaseModel):
    pdfs: list[PDFMeta]

# ── Query ──────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    pdf_id: Optional[str] = None     # if None, searches across ALL ingested PDFs

class Citation(BaseModel):
    pdf_id: str
    page: int                        # 1-indexed for display

class QueryResponse(BaseModel):
    answer: str
    citations: list[Citation]
    images: list[str]                # list of /images/<filename> URLs

# ── Deletion ───────────────────────────────────────────────

class DeleteResponse(BaseModel):
    pdf_id: str
    status: str = "deleted"
    vectors_removed: bool = True
    images_removed: bool = True

# ── Internal chunk (not exposed via API) ───────────────────

class Chunk(BaseModel):
    chunk_id: str
    pdf_id: str
    page: int                        # 0-indexed internally
    text: str
    image_paths: list[str] = []
    bbox: Optional[list[float]] = None