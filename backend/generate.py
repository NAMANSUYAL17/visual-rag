# generate.py — complete fixed file
from dotenv import load_dotenv
load_dotenv()

from groq import Groq
import os

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are a precise document QA assistant.

Rules you must follow:
1. Answer ONLY using the context provided below. Do not use outside knowledge.
2. If the answer is not in the context, respond exactly: "I don't have enough information in the provided documents."
3. Always cite your source using [Page X] inline when you reference content.
4. Be concise and factual.
"""

def generate_answer(query: str, chunks: list) -> dict:
    # Use dot notation (Chunk is a Pydantic object, not a dict)
    context_parts = []
    for c in chunks:
        context_parts.append(
            f"[Page {c.page + 1} | PDF: {c.pdf_id[:8]}]\n{c.text}"
        )
    context = "\n\n---\n\n".join(context_parts)

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}
        ],
        temperature=0.1,
        max_tokens=1024,
    )

    answer_text = response.choices[0].message.content

    # Collect unique images
    seen = set()
    images = []
    for c in chunks:
        for path in c.image_paths:          # dot notation
            fname = os.path.basename(path)
            if fname not in seen:
                seen.add(fname)
                images.append(f"/images/{fname}")

    citations = [
        {"page": c.page + 1, "pdf_id": c.pdf_id}   # dot notation
        for c in chunks
    ]

    return {
        "answer": answer_text,
        "citations": citations,
        "images": images
    }