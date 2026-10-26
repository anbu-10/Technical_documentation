import pytest
import re
import html
from backend.services.parser import clean_extracted_text
from backend.services.llm import LLMService
from backend.services.retriever import ScoredChunk
from backend.models import Document, DocumentChunk

def test_example_d_entity_decoding():
    # Example D: &#x20; should become a space
    raw = "Section&#x20;on&#x20;Page&#x20;24"
    cleaned = clean_extracted_text(raw)
    assert cleaned == "Section on Page 24"

    # Other common HTML entities
    raw_mixed = "Architecture &amp; Cache &lt;v1.0&gt; &#x20; &quot;High Availability&quot;"
    cleaned_mixed = clean_extracted_text(raw_mixed)
    assert cleaned_mixed == 'Architecture & Cache <v1.0>   "High Availability"'

def test_backend_synthesizer_clean_markdown_contract():
    # Mock chunks
    doc = Document(id="doc-123", original_name="TechDoc_AI_Mini_Project_Report_102_pages.docx")
    c1 = DocumentChunk(
        id="chunk-1",
        document_id="doc-123",
        page_number=24,
        section_heading="Section on Page 24",
        text_content="Distributed cache utilizes virtual nodes across consistent hashing rings for balanced replication."
    )
    c1.document = doc

    sc1 = ScoredChunk(
        chunk=c1,
        document=doc,
        vector_score=0.88,
        bm25_score=0.75,
        final_score=0.84,
        method="hybrid"
    )

    answer_text = LLMService._synthesize_local_grounded_answer(
        question="What is the cache architecture?",
        chunks=[sc1]
    )

    # Verify Example A: Level-four heading exists in markdown format
    assert "#### Section on Page 24" in answer_text
    # Verify no raw backslash before hash
    assert "\\####" not in answer_text

    # Verify bullet point with citation marker [1]
    assert "- " in answer_text
    assert "[1]" in answer_text

    # Verify no hardcoded raw markdown evidence header in content
    # (Contract specifies structured component rendering on frontend)
    assert "### Verified Source Evidence" not in answer_text

def test_markdown_regex_normalizer():
    # Test logic matching frontend textFormatter.ts
    raw_text = r"\#### Section on Page 24 **[2]** \*TechDoc_AI_Mini_Project_Report_102_pages.docx (Page 24)\* &#x20; &#x20;"
    
    # 1. Unescape hex whitespace
    t = re.sub(r'&#x20;', ' ', raw_text)
    # 2. Normalize accidental backslash escapes
    t = re.sub(r'^\\(#{1,6}\s)', r'\1', t, flags=re.MULTILINE)
    t = re.sub(r'\\\*', '*', t)
    t = re.sub(r'\*\*\[(\d+)\]\*\*', r'[\1]', t)

    assert "#### Section on Page 24" in t
    assert "*TechDoc_AI_Mini_Project_Report_102_pages.docx (Page 24)*" in t
    assert "[2]" in t
    assert "&#x20;" not in t
    assert "\\####" not in t
