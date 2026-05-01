"""
RAG Query Engine for ATmega328P Virtual Lab
=============================================
Searches ChromaDB for relevant datasheet chunks
and uses Groq to generate grounded answers.

Usage:
    from rag.query import RAGEngine
    engine = RAGEngine()
    answer = engine.ask("How do I configure PWM on Timer1?")
"""

import os
import json
import time as _time
from typing import Any, Optional

import chromadb  # type: ignore
from groq import Groq  # type: ignore

CHROMA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "chromadb_store")
COLLECTION_NAME = "atmega328p_docs"


class RAGEngine:
    """Retrieval-Augmented Generation engine for ATmega328P queries."""

    def __init__(self) -> None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY not set! "
                "Set it with: export GROQ_API_KEY='your-key-here'"
            )

        self.client = Groq(api_key=api_key)
        self.model_name = "llama-3.3-70b-versatile"

        # Connect to ChromaDB (uses built-in all-MiniLM-L6-v2 embeddings)
        self.chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)

        try:
            self.collection = self.chroma_client.get_collection(COLLECTION_NAME)
            self.has_documents = self.collection.count() > 0
        except Exception:
            self.collection = None
            self.has_documents = False

        if not self.has_documents:
            print("⚠️  No documents in vector DB. Run ingestion first: python -m rag.ingest")

    def _retrieve(self, query: str, n_results: int = 5) -> list[dict[str, Any]]:
        """Search ChromaDB for the most relevant chunks."""
        if not self.has_documents or not self.collection:
            return []

        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )

        retrieved: list[dict[str, Any]] = []
        docs = results.get("documents") or [[]]
        metas = results.get("metadatas") or [[]]
        dists = results.get("distances") or [[]]

        for i in range(len(docs[0])):  # type: ignore
            retrieved.append({
                "text": docs[0][i],  # type: ignore
                "source": metas[0][i].get("source", "unknown") if metas[0] else "unknown",  # type: ignore
                "page": metas[0][i].get("page", 0) if metas[0] else 0,  # type: ignore
                "distance": dists[0][i] if dists and dists[0] else None  # type: ignore
            })

        return retrieved

    def _generate(self, prompt: str, max_tokens: int = 1024) -> str:
        """Call Groq chat completions."""
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

    def ask(self, question: str, context_mode: str = "chatbot") -> dict[str, Any]:
        """
        Answer a question using RAG (retrieval + generation).

        Args:
            question: User's question about ATmega328P
            context_mode: "chatbot" for conversational, "theory" for educational content

        Returns:
            {"answer": str, "sources": list[dict], "has_context": bool}
        """
        # Step 1: Retrieve relevant chunks
        retrieved = self._retrieve(question, n_results=5)
        has_context = len(retrieved) > 0

        # Step 2: Build the prompt
        if has_context:
            context_text = "\n\n---\n\n".join([
                f"[Source: {r['source']}, Page {r['page']}]\n{r['text']}"
                for r in retrieved
            ])

            if context_mode == "chatbot":
                prompt = f"""You are an expert ATmega328P microcontroller teaching assistant for a virtual lab.
Answer the student's question using ONLY the information from the datasheet excerpts below.
Be concise, practical, and include register names and bit positions when relevant.
If the excerpts don't contain enough information, say so honestly and provide general guidance.

## Datasheet Excerpts:
{context_text}

## Student's Question:
{question}

## Your Answer:"""
            else:  # theory mode
                prompt = f"""You are writing educational content about the ATmega328P microcontroller.
Using the datasheet excerpts below, write a clear, thorough explanation suitable for engineering students.
Include register names, bit configurations, and practical examples where appropriate.

## Datasheet Excerpts:
{context_text}

## Topic:
{question}

## Educational Content:"""
        else:
            # No documents ingested — use model's built-in knowledge
            prompt = f"""You are an expert ATmega328P microcontroller teaching assistant.
Answer the following question about the ATmega328P microcontroller.
Be specific — include register names (DDRx, PORTx, PINx, TCCR, etc.), bit positions, and practical code examples where relevant.
If you're not sure about specific register details, say so.

## Question:
{question}

## Answer:"""

        # Step 3: Generate answer
        try:
            answer = self._generate(prompt)
        except Exception as e:
            answer = f"Error generating response: {str(e)}"

        return {
            "answer": answer,
            "sources": [{"source": r["source"], "page": r["page"]} for r in retrieved],
            "has_context": has_context
        }

    def generate_experiment_content(
        self, experiment_topic: str, experiment_details: dict[str, Any]
    ) -> Optional[dict[str, Any]]:
        """
        Generate full experiment content (aim, theory, pretest, procedure, posttest, feedback)
        using RAG to ground the content in the actual datasheet.
        """
        retrieved = self._retrieve(experiment_topic, n_results=8)

        context_text = ""
        if retrieved:
            context_text = "\n\n---\n\n".join([
                f"[Source: {r['source']}, Page {r['page']}]\n{r['text']}"
                for r in retrieved
            ])

        difficulty = experiment_details.get("difficulty", "Beginner")

        prompt = f"""You are creating structured educational content for an ATmega328P virtual lab experiment.

Topic: {experiment_topic}
Difficulty: {difficulty}
Additional Details: {experiment_details}

{"## Relevant Datasheet Excerpts:" + chr(10) + context_text if context_text else "Use your knowledge of ATmega328P."}

Generate a COMPLETE experiment in the following JSON structure. Return ONLY valid JSON, no markdown:

{{
  "id": "<snake_case_id>",
  "title": "<Experiment Title>",
  "difficulty": "{difficulty}",
  "aim": "<One sentence aim>",
  "objective": "<One sentence learning objective>",
  "theory": "<HTML formatted theory, 3-5 paragraphs. Use <p>, <b>, <code>, <ul>, <li> tags. Include register names and bit details.>",
  "pretest": [
    {{
      "question": "<MCQ question>",
      "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
      "correct_answer_index": <0-3>,
      "explanation": "<Why this is correct>"
    }},
    {{
      "question": "<MCQ question 2>",
      "options": ["<A>", "<B>", "<C>", "<D>"],
      "correct_answer_index": <0-3>,
      "explanation": "<explanation>"
    }},
    {{
      "question": "<MCQ question 3>",
      "options": ["<A>", "<B>", "<C>", "<D>"],
      "correct_answer_index": <0-3>,
      "explanation": "<explanation>"
    }}
  ],
  "procedure": [
    "<Step 1>",
    "<Step 2>",
    "<Step 3>",
    "<Step 4>",
    "<Step 5>"
  ],
  "posttest": [
    {{
      "question": "<MCQ question>",
      "options": ["<A>", "<B>", "<C>", "<D>"],
      "correct_answer_index": <0-3>,
      "explanation": "<explanation>"
    }},
    {{
      "question": "<MCQ question 2>",
      "options": ["<A>", "<B>", "<C>", "<D>"],
      "correct_answer_index": <0-3>,
      "explanation": "<explanation>"
    }},
    {{
      "question": "<MCQ question 3>",
      "options": ["<A>", "<B>", "<C>", "<D>"],
      "correct_answer_index": <0-3>,
      "explanation": "<explanation>"
    }}
  ],
  "feedback": "<Congratulatory feedback summarizing what was learned>"
}}"""

        max_retries = 3
        for attempt in range(max_retries):
            try:
                text = self._generate(prompt, max_tokens=2048).strip()
                if text.startswith("```"):
                    text = text.split("\n", 1)[1]
                if text.endswith("```"):
                    text = text.rsplit("```", 1)[0]
                return json.loads(text)
            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "rate_limit" in error_str.lower():
                    wait_time = 15 * (attempt + 1)
                    if attempt < max_retries - 1:
                        print(f"   ⏳ Rate limited, waiting {wait_time}s (attempt {attempt+1}/{max_retries})...")
                        _time.sleep(wait_time)
                        continue
                print(f"❌ Error generating experiment content: {e}")
                return None

        return None
