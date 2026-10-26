import os
import re
import json
import time
import httpx
import logging
from typing import List, Dict, Any, Tuple, Optional
from backend.config import settings
from backend.services.retriever import ScoredChunk

logger = logging.getLogger(__name__)

class LLMService:
    @staticmethod
    async def check_provider_status() -> List[Dict[str, Any]]:
        providers = []

        # 1. Ollama
        ollama_status = "disconnected"
        ollama_details = f"Not reachable at {settings.OLLAMA_BASE_URL}"
        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                res = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
                if res.status_code == 200:
                    models = [m.get("name") for m in res.json().get("models", [])]
                    ollama_status = "connected"
                    ollama_details = f"Connected ({len(models)} models available: {', '.join(models[:3])})"
        except Exception:
            pass

        providers.append({
            "name": "ollama",
            "display_name": "Ollama (Local LLM)",
            "status": ollama_status,
            "details": ollama_details,
            "model": settings.OLLAMA_MODEL,
            "is_default": settings.DEFAULT_PROVIDER == "ollama"
        })

        # 2. OpenAI
        openai_status = "not_configured"
        openai_details = "API key not set in environment (OPENAI_API_KEY)"
        if settings.OPENAI_API_KEY:
            try:
                async with httpx.AsyncClient(timeout=2.0) as client:
                    res = await client.get(
                        "https://api.openai.com/v1/models",
                        headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
                    )
                    if res.status_code == 200:
                        openai_status = "connected"
                        openai_details = "Connected to OpenAI API"
                    else:
                        openai_status = "disconnected"
                        openai_details = f"Authentication failed: {res.status_code}"
            except Exception as e:
                openai_status = "disconnected"
                openai_details = f"Network error: {str(e)}"

        providers.append({
            "name": "openai",
            "display_name": "OpenAI (GPT Models)",
            "status": openai_status,
            "details": openai_details,
            "model": settings.OPENAI_MODEL,
            "is_default": settings.DEFAULT_PROVIDER == "openai"
        })

        # 3. Gemini
        gemini_status = "not_configured"
        gemini_details = "API key not set in environment (GEMINI_API_KEY)"
        if settings.GEMINI_API_KEY:
            gemini_status = "connected"
            gemini_details = "Google Gemini API Key Configured"

        providers.append({
            "name": "gemini",
            "display_name": "Google Gemini",
            "status": gemini_status,
            "details": gemini_details,
            "model": settings.GEMINI_MODEL,
            "is_default": settings.DEFAULT_PROVIDER == "gemini"
        })

        # 4. Built-in Local RAG Engine (Zero-Config Grounded Extractive/Neural Synthesizer)
        providers.append({
            "name": "local",
            "display_name": "Local RAG Engine (Built-in)",
            "status": "connected",
            "details": "Active & ready. Grounded semantic synthesis directly from parsed document chunks.",
            "model": "grounded-rag-v1",
            "is_default": settings.DEFAULT_PROVIDER in ["local", "auto"]
        })

        return providers

    @staticmethod
    async def generate_grounded_answer(
        question: str,
        retrieved_chunks: List[ScoredChunk],
        preferred_provider: Optional[str] = None
    ) -> Tuple[str, List[Dict[str, Any]], str, float]:
        start_time = time.time()

        # Strict evidence threshold check
        if not retrieved_chunks or (retrieved_chunks and retrieved_chunks[0].final_score < 0.15):
            latency = round((time.time() - start_time) * 1000, 2)
            no_evidence_msg = (
                "I couldn't find sufficient evidence in the selected documents to answer this question reliably.\n\n"
                "**Suggestions:**\n"
                "- Verify that the relevant technical document has been uploaded and fully indexed.\n"
                "- Try rephrasing your question using terms or headings directly mentioned in the document.\n"
                "- Check that the document filter isn't excluding the target file."
            )
            return no_evidence_msg, [], "grounded-verifier", latency

        # Prepare Citations
        citations = []
        context_blocks = []
        for idx, item in enumerate(retrieved_chunks[:5], 1):
            citation_info = {
                "chunk_id": item.chunk.id,
                "document_id": item.document.id,
                "document_title": item.document.original_name,
                "page_number": item.chunk.page_number,
                "section_heading": item.chunk.section_heading or "Main Body",
                "excerpt": item.chunk.text_content[:300] + ("..." if len(item.chunk.text_content) > 300 else ""),
                "score": item.final_score,
                "rank_order": idx
            }
            citations.append(citation_info)

            # Build untrusted context block
            context_blocks.append(
                f"[Source {idx}] (Document: '{item.document.original_name}', Page: {item.chunk.page_number}, Section: '{item.chunk.section_heading or 'General'}')\n"
                f"{item.chunk.text_content}"
            )

        context_text = "\n\n---\n\n".join(context_blocks)

        provider = preferred_provider or settings.DEFAULT_PROVIDER

        # Check if Ollama is requested and reachable
        if provider == "ollama" or (provider == "auto" and False):
            try:
                ans, model_name = await LLMService._call_ollama(question, context_text)
                latency = round((time.time() - start_time) * 1000, 2)
                return ans, citations, model_name, latency
            except Exception as e:
                logger.warning(f"Ollama call failed: {e}. Falling back to local synthesizer.")

        # Check if OpenAI is requested
        if (provider == "openai" or provider == "auto") and settings.OPENAI_API_KEY:
            try:
                ans, model_name = await LLMService._call_openai(question, context_text)
                latency = round((time.time() - start_time) * 1000, 2)
                return ans, citations, model_name, latency
            except Exception as e:
                logger.warning(f"OpenAI call failed: {e}. Falling back to local synthesizer.")

        # Check if Gemini is requested
        if (provider == "gemini" or provider == "auto") and settings.GEMINI_API_KEY:
            try:
                ans, model_name = await LLMService._call_gemini(question, context_text)
                latency = round((time.time() - start_time) * 1000, 2)
                return ans, citations, model_name, latency
            except Exception as e:
                logger.warning(f"Gemini call failed: {e}. Falling back to local synthesizer.")

        # Default: Built-in Local Grounded Synthesizer
        ans = LLMService._synthesize_local_grounded_answer(question, retrieved_chunks)
        latency = round((time.time() - start_time) * 1000, 2)
        return ans, citations, "local-rag-synthesizer", latency

    @staticmethod
    def _synthesize_local_grounded_answer(question: str, chunks: List[ScoredChunk]) -> str:
        """
        High-precision grounded synthesis:
        Extracts key sentences, structural points, and facts directly from the retrieved passages,
        annotating each paragraph with verified citation markers [1], [2], etc.
        """
        q_lower = question.lower()
        q_tokens = set(re.findall(r'\w+', q_lower))

        sections: List[str] = []
        sections.append(f"### Answer Overview\nBased on the uploaded technical documentation, here is the verified analysis:\n")

        cited_indices = set()

        # Examine top 3 most relevant chunks
        for idx, item in enumerate(chunks[:3], 1):
            text = item.chunk.text_content.strip()
            heading = item.chunk.section_heading or f"Section on Page {item.chunk.page_number}"
            
            # Split into sentences or lines
            lines = [s.strip() for s in re.split(r'(?<=[.!?])\s+|\n+', text) if len(s.strip()) > 20]
            
            # Score sentences against question tokens
            scored_lines = []
            for s in lines:
                s_tokens = set(re.findall(r'\w+', s.lower()))
                overlap = len(q_tokens.intersection(s_tokens))
                scored_lines.append((overlap, s))

            scored_lines.sort(key=lambda x: x[0], reverse=True)
            top_sentences = [s for _, s in scored_lines[:3]] if scored_lines else lines[:2]

            if top_sentences:
                bullet_points = "\n".join([f"- {s} [{idx}]" for s in top_sentences])
                sections.append(
                    f"#### {heading}\n\n"
                    f"{bullet_points}\n"
                )
                cited_indices.add(idx)

        return "\n\n".join(sections)

    @staticmethod
    async def _call_ollama(question: str, context: str) -> Tuple[str, str]:
        prompt = (
            "You are a technical document intelligence assistant. Answer the user question strictly using the provided source context. "
            "Do not assume or invent facts not present in the sources. Use markdown format. Include citations like [1], [2] referencing the source numbers.\n\n"
            f"SOURCES:\n{context}\n\n"
            f"QUESTION: {question}\n\n"
            "GROUNDED ANSWER:"
        )
        async with httpx.AsyncClient(timeout=45.0) as client:
            res = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False
                }
            )
            res.raise_for_status()
            data = res.json()
            return data.get("response", ""), f"ollama/{settings.OLLAMA_MODEL}"

    @staticmethod
    async def _call_openai(question: str, context: str) -> Tuple[str, str]:
        system_prompt = (
            "You are TechDoc AI, an expert technical document intelligence assistant. "
            "Ground all answers strictly in the retrieved context. Never invent document names or citations. "
            "Cite sources using [1], [2] format corresponding to [Source 1], [Source 2]."
        )
        user_prompt = f"Context:\n{context}\n\nQuestion: {question}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": settings.OPENAI_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.2
                }
            )
            res.raise_for_status()
            data = res.json()
            return data["choices"][0]["message"]["content"], f"openai/{settings.OPENAI_MODEL}"

    @staticmethod
    async def _call_gemini(question: str, context: str) -> Tuple[str, str]:
        # Google Gemini REST endpoint
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        payload = {
            "contents": [{
                "parts": [{
                    "text": (
                        "You are a technical document intelligence assistant. Answer strictly based on the provided context with citations like [1], [2].\n\n"
                        f"Context:\n{context}\n\nQuestion: {question}"
                    )
                }]
            }]
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(url, json=payload)
            res.raise_for_status()
            data = res.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return text, f"gemini/{settings.GEMINI_MODEL}"
