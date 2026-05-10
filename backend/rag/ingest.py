"""
RAG Ingestion Pipeline for ATmega328P Virtual Lab
===================================================
Reads PDF datasheets/books from backend/data/datasheets/,
chunks the text, and stores everything in a local ChromaDB
vector database using the built-in all-MiniLM-L6-v2 embeddings.

Usage:
    python -m rag.ingest
"""

import os
import glob
import chromadb  # type: ignore
from pypdf import PdfReader  # type: ignore
from typing import Any, List, Dict, Tuple

# ---------------------------
# Configuration
# ---------------------------
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "datasheets")
CHROMA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "chromadb_store")
COLLECTION_NAME = "atmega328p_docs"
CHUNK_SIZE: int = 800       # characters per chunk
CHUNK_OVERLAP: int = 150    # overlap between chunks for context continuity


def load_pdfs(data_dir: str) -> List[Dict[str, Any]]:
    """Reads all PDFs in data_dir and returns a list of {filename, page, text}."""
    documents: List[Dict[str, Any]] = []
    pdf_files = glob.glob(os.path.join(data_dir, "*.pdf"))

    if not pdf_files:
        print(f"⚠️  No PDF files found in {os.path.abspath(data_dir)}")

    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        print(f"📄 Reading: {filename}")

        try:
            reader = PdfReader(pdf_path)
            for page_num, page in enumerate(reader.pages):
                extracted = page.extract_text()
                text = str(extracted) if extracted else ""
                if text and len(text.strip()) > 50:
                    documents.append({
                        "filename": filename,
                        "page": page_num + 1,
                        "text": text.strip()
                    })
        except Exception as e:
            print(f"   ❌ Error reading {filename}: {e}")

    print(f"✅ Extracted {len(documents)} pages from {len(pdf_files)} PDF(s)")
    return documents


def load_text_files(data_dir: str) -> List[Dict[str, Any]]:
    """Reads all .txt knowledge files and returns {filename, page, text} entries."""
    documents: List[Dict[str, Any]] = []
    txt_files = glob.glob(os.path.join(data_dir, "*.txt"))

    for txt_path in txt_files:
        filename = os.path.basename(txt_path)
        print(f"📝 Reading: {filename}")
        try:
            with open(txt_path, encoding="utf-8") as f:
                content = f.read().strip()
            if len(content) > 50:
                # Split on "---" section separators so each experiment is a separate page
                sections = [s.strip() for s in content.split("\n---\n") if len(s.strip()) > 50]
                for idx, section in enumerate(sections):
                    documents.append({
                        "filename": filename,
                        "page": idx + 1,
                        "text": section,
                    })
        except Exception as e:
            print(f"   ❌ Error reading {filename}: {e}")

    print(f"✅ Loaded {len(documents)} sections from {len(txt_files)} text file(s)")
    return documents


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Split text into overlapping chunks for better retrieval."""
    chunks: List[str] = []
    start: int = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if len(chunk.strip()) > 30:
            chunks.append(chunk.strip())
        start = end - overlap
    return chunks


def create_chunks(documents: List[Dict[str, Any]]) -> Tuple[List[str], List[Dict[str, Any]], List[str]]:
    """Convert page-level documents into overlapping chunks with metadata."""
    all_chunks: List[str] = []
    all_metadatas: List[Dict[str, Any]] = []
    all_ids: List[str] = []

    chunk_counter: int = 0
    for doc in documents:
        text = str(doc.get("text", ""))
        chunks = chunk_text(text)
        for i, chunk in enumerate(chunks):
            all_chunks.append(chunk)
            all_metadatas.append({
                "source": str(doc.get("filename", "")),
                "page": int(doc.get("page", 0)),
                "chunk_index": i
            })
            all_ids.append(f"chunk_{chunk_counter}")
            chunk_counter += 1

    print(f"✅ Created {len(all_chunks)} chunks (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})")
    return all_chunks, all_metadatas, all_ids


def embed_and_store(chunks: List[str], metadatas: List[Dict[str, Any]], ids: List[str]) -> None:
    """Store chunks in ChromaDB — embeddings are computed automatically by ChromaDB."""
    client = chromadb.PersistentClient(path=CHROMA_DIR)

    # Delete existing collection if re-ingesting
    try:
        client.delete_collection(COLLECTION_NAME)
        print("🗑️  Cleared old collection")
    except Exception:
        pass

    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"description": "ATmega328P datasheet and textbook chunks"}
    )

    # Store in batches (ChromaDB auto-computes embeddings via all-MiniLM-L6-v2)
    BATCH_SIZE: int = 100
    total = len(chunks)

    for i in range(0, total, BATCH_SIZE):
        batch_chunks = chunks[i:i + BATCH_SIZE]
        batch_metas = metadatas[i:i + BATCH_SIZE]
        batch_ids = ids[i:i + BATCH_SIZE]

        print(f"   Storing batch {i // BATCH_SIZE + 1}/{(total + BATCH_SIZE - 1) // BATCH_SIZE}...")

        collection.add(
            documents=batch_chunks,
            metadatas=batch_metas,
            ids=batch_ids
        )

    print(f"✅ Stored {total} chunks in ChromaDB at {os.path.abspath(CHROMA_DIR)}")


def run_ingestion() -> bool:
    """Main ingestion pipeline."""
    print("=" * 60)
    print("  ATmega328P Virtual Lab — RAG Ingestion Pipeline")
    print("=" * 60)

    # Step 1: Load PDFs + text knowledge files
    documents = load_pdfs(DATA_DIR)
    documents += load_text_files(DATA_DIR)
    if not documents:
        print("⚠️  No documents found. Add PDFs or .txt files to:", DATA_DIR)
        return False

    # Step 2: Chunk
    chunks, metadatas, ids = create_chunks(documents)

    # Step 3: Store (ChromaDB handles embeddings automatically)
    embed_and_store(chunks, metadatas, ids)

    print("=" * 60)
    print("  ✅ INGESTION COMPLETE!")
    print(f"  📁 Vector DB: {os.path.abspath(CHROMA_DIR)}")
    print(f"  📊 Total chunks: {len(chunks)}")
    print("=" * 60)
    return True


if __name__ == "__main__":
    run_ingestion()
