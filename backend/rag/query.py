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
from groq.types.chat import ChatCompletionMessageParam # type: ignore

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
        self.model_name = "llama-3.1-8b-instant"

        # Connect to ChromaDB (uses built-in all-MiniLM-L6-v2 embeddings)
        self.chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)

        try:
            self.collection: Any = self.chroma_client.get_collection(COLLECTION_NAME)
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

    SYSTEM_PROMPT = (
        "You are Embedex, a Socratic teaching assistant for an ATmega328P and ESP32 virtual electronics lab. "
        "Your role is to guide students to discover solutions themselves — NOT to hand them complete code. "
        "\n\n"
        "HINT RULES (always follow these):\n"
        "- Give one small hint at a time: name the register, or the bit, or the concept — not the full line.\n"
        "- If a student asks 'what is the code' or 'give me the solution', refuse politely and ask what they have tried.\n"
        "- If a student shows partial code with a bug, point out the wrong part without rewriting it for them.\n"
        "- If a student is stuck after 3 hints on the same concept, you may reveal that single line but explain why.\n"
        "- Full solution code is NEVER given unless the student has unlocked it via a perfect pre-test score (the UI handles that).\n"
        "\n"
        "STYLE:\n"
        "- For greetings or small talk: respond briefly and warmly.\n"
        "- For technical questions: reference register names (DDRB, PORTB, TCCR0A…) and bit positions precisely.\n"
        "- Keep answers short and Socratic: end with a guiding question when possible.\n"
        "- Never write multi-paragraph essays."
    )

    def _generate(self, messages: list[dict[str, str]], max_tokens: int = 1024) -> str:
        """Call Groq chat completions with a system prompt."""
        # Wrap messages in a list of ChatCompletionMessageParam objects for the SDK
        full_messages = [{"role": "system", "content": self.SYSTEM_PROMPT}] + messages
        
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=full_messages, # type: ignore
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

    def _is_technical(self, question: str) -> bool:
        """Return True if the question looks like a technical query worth running RAG on."""
        q = question.lower().strip()
        # Skip RAG for very short or clearly conversational messages
        if len(q) < 10:
            return False
        greetings = {"hi", "hello", "hey", "thanks", "thank you", "ok", "okay", "bye", "cool", "nice", "great"}
        if q.rstrip("!.,?") in greetings:
            return False
        return True

    def ask(self, question: str, context_mode: str = "chatbot") -> dict[str, Any]:
        """
        Answer a question using RAG (retrieval + generation).

        Args:
            question: User's question about ATmega328P
            context_mode: "chatbot" for conversational, "theory" for educational content

        Returns:
            {"answer": str, "sources": list[dict], "has_context": bool}
        """
        # Step 1: Retrieve relevant chunks only for technical questions
        retrieved = self._retrieve(question, n_results=5) if self._is_technical(question) else []
        has_context = len(retrieved) > 0

        # Step 2: Build the user message
        if has_context:
            context_text = "\n\n---\n\n".join([
                f"[Source: {r['source']}, Page {r['page']}]\n{r['text']}"
                for r in retrieved
            ])

            if context_mode == "chatbot":
                user_content = (
                    f"Use the datasheet excerpts below to answer the question. "
                    f"Be concise and practical.\n\n"
                    f"## Datasheet Excerpts:\n{context_text}\n\n"
                    f"## Question:\n{question}"
                )
            else:
                user_content = (
                    f"Using the datasheet excerpts below, write a clear explanation for engineering students.\n\n"
                    f"## Datasheet Excerpts:\n{context_text}\n\n"
                    f"## Topic:\n{question}"
                )
        else:
            user_content = question

        # Step 3: Generate answer
        try:
            answer = self._generate([{"role": "user", "content": user_content}])
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
                text = self._generate([{"role": "user", "content": prompt}], max_tokens=2048).strip()
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
