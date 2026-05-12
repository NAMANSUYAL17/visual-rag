# backend/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    # API Keys
    groq_api_key: str
    google_api_key: str

    # Paths
    storage_dir: str = "storage"       # where extracted images are saved
    chroma_path: str = "chroma_data"   # where ChromaDB persists to disk

    # RAG settings
    top_k: int = 5                     # how many chunks to retrieve per query
    chunk_min_chars: int = 40          # ignore text blocks shorter than this
    image_proximity_px: int = 150      # pixel threshold for text-image association
    embed_batch_size: int = 50         # chunks per Google embedding batch

    # Models
    groq_model: str = "llama-3.3-70b-versatile"
    embedding_model: str = "gemini-embedding-001"   # ← updated
    embedding_size: int = 768 

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache()          # instantiated once, reused everywhere
def get_settings() -> Settings:
    return Settings()