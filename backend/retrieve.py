# backend/retrieve.py
from embed import search
from models import Chunk
from config import get_settings

settings = get_settings()

def retrieve(
    query: str,
    pdf_id: str = None,
    top_k: int = None
) -> list[Chunk]:
    """
    Semantic search over ChromaDB.
    Returns a list of Chunk objects ranked by relevance.
    Falls back to settings.top_k if top_k not passed.
    """
    k = top_k or settings.top_k
    raw_chunks = search(query=query, pdf_id=pdf_id, top_k=k)

    # Convert raw dicts from embed.py into typed Chunk objects
    chunks = []
    for c in raw_chunks:
        chunks.append(Chunk(
            chunk_id=c.get("chunk_id", ""),
            pdf_id=c["pdf_id"],
            page=c["page"],
            text=c["text"],
            image_paths=c.get("image_paths", []),
        ))

    return chunks