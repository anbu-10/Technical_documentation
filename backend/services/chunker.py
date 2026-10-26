import re
from typing import List, Dict, Any
from backend.services.parser import ParsedPage

class ChunkItem:
    def __init__(self, chunk_index: int, page_number: int, section_heading: str, text: str, token_count: int):
        self.chunk_index = chunk_index
        self.page_number = page_number
        self.section_heading = section_heading
        self.text = text
        self.token_count = token_count

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_index": self.chunk_index,
            "page_number": self.page_number,
            "section_heading": self.section_heading,
            "text": self.text,
            "token_count": self.token_count,
        }

class DocumentChunker:
    @staticmethod
    def chunk_pages(
        pages: List[ParsedPage],
        chunk_size: int = 600,
        chunk_overlap: int = 120
    ) -> List[ChunkItem]:
        chunks: List[ChunkItem] = []
        global_chunk_idx = 0

        for page in pages:
            page_text = page.text.strip()
            if not page_text:
                continue

            current_heading = page.headings[0] if page.headings else ""

            # Check if there are Markdown headers in the text to update current_heading
            paragraphs = page_text.split("\n\n")
            current_chunk_words: List[str] = []
            current_chunk_length = 0

            for para in paragraphs:
                para = para.strip()
                if not para:
                    continue

                # Check if paragraph is a heading
                if para.startswith("#"):
                    header_match = re.match(r"^#+\s*(.+)", para)
                    if header_match:
                        current_heading = header_match.group(1).strip()

                words = para.split()
                if not words:
                    continue

                # If adding this paragraph exceeds chunk_size (in words ~ characters/5)
                # We measure size in roughly characters or words. Let's use word count (~1.3 tokens per word)
                # Default chunk_size of 600 tokens ≈ 450 words
                max_words = int(chunk_size * 0.75)
                overlap_words = int(chunk_overlap * 0.75)

                for w in words:
                    current_chunk_words.append(w)
                    if len(current_chunk_words) >= max_words:
                        chunk_text = " ".join(current_chunk_words)
                        token_estimate = max(1, int(len(chunk_text) / 4))
                        chunks.append(ChunkItem(
                            chunk_index=global_chunk_idx,
                            page_number=page.page_number,
                            section_heading=current_heading,
                            text=chunk_text,
                            token_count=token_estimate
                        ))
                        global_chunk_idx += 1
                        # Retain overlap words
                        current_chunk_words = current_chunk_words[-overlap_words:]

            # Flush remaining words in this page
            if current_chunk_words and len(current_chunk_words) > 15:
                chunk_text = " ".join(current_chunk_words)
                token_estimate = max(1, int(len(chunk_text) / 4))
                chunks.append(ChunkItem(
                    chunk_index=global_chunk_idx,
                    page_number=page.page_number,
                    section_heading=current_heading,
                    text=chunk_text,
                    token_count=token_estimate
                ))
                global_chunk_idx += 1

        # Fallback if document was extremely short
        if not chunks and pages:
            first_page = pages[0]
            chunks.append(ChunkItem(
                chunk_index=0,
                page_number=first_page.page_number,
                section_heading=first_page.headings[0] if first_page.headings else "Document Content",
                text=first_page.text[:1000],
                token_count=max(1, int(len(first_page.text[:1000]) / 4))
            ))

        return chunks
