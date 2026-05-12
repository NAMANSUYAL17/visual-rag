# embed.py — complete updated file
# embed.py — complete updated file
from dotenv import load_dotenv
load_dotenv()

from google import genai
from google.genai import types
from chromadb import PersistentClient
import os

client_google = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

chroma_client = PersistentClient(path="chroma_data")
collection = chroma_client.get_or_create_collection(
    name="rag_chunks",
    metadata={"hnsw:space": "cosine"}
)

def get_embedding(text: str) -> list[float]:
    response = client_google.models.embed_content(
        model="gemini-embedding-001",        # ← updated model
        contents=text,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=768        # ← keeps it small, still high quality
        )
    )
    return response.embeddings[0].values

def get_query_embedding(text: str) -> list[float]:
    response = client_google.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_QUERY",
            output_dimensionality=768
        )
    )
    return response.embeddings[0].values

def embed_and_store(chunks: list):
    ids, embeddings, documents, metadatas = [], [], [], []

    for chunk in chunks:
        vector = get_embedding(chunk["text"])
        ids.append(chunk["chunk_id"])
        embeddings.append(vector)
        documents.append(chunk["text"])
        metadatas.append({
            "pdf_id":      chunk["pdf_id"],
            "page":        chunk["page"],
            "image_paths": ",".join(chunk["image_paths"]),
        })

    batch_size = 50
    for i in range(0, len(ids), batch_size):
        collection.upsert(
            ids=ids[i:i+batch_size],
            embeddings=embeddings[i:i+batch_size],
            documents=documents[i:i+batch_size],
            metadatas=metadatas[i:i+batch_size],
        )

def delete_pdf_vectors(pdf_id: str):
    collection.delete(where={"pdf_id": pdf_id})

def search(query: str, pdf_id: str = None, top_k: int = 5) -> list:
    query_vec = get_query_embedding(query)
    where_filter = {"pdf_id": pdf_id} if pdf_id else None

    # Check how many items exist before querying
    count = collection.count()
    if count == 0:
        return []

    # Don't ask for more results than exist
    actual_k = min(top_k, count)

    results = collection.query(
        query_embeddings=[query_vec],
        n_results=actual_k,
        where=where_filter,
        include=["documents", "metadatas", "distances"]
    )

    chunks = []
    for i, doc in enumerate(results["documents"][0]):
        meta = results["metadatas"][0][i]
        chunks.append({
            "text":        doc,
            "pdf_id":      meta["pdf_id"],
            "page":        meta["page"],
            "image_paths": [p for p in meta["image_paths"].split(",") if p],
        })
    return chunks