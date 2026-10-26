import os
import re
import html
from pathlib import Path
from typing import List, Dict, Any

def clean_extracted_text(text: str) -> str:
    if not text:
        return ""
    # Decode HTML entities like &#x20;, &#32;, &nbsp;, &amp;, &lt;, &gt;, &quot;
    cleaned = html.unescape(text)
    cleaned = re.sub(r'&#x20;|&#32;|&nbsp;', ' ', cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.replace('\u00a0', ' ')
    return cleaned

class ParsedPage:
    def __init__(self, page_number: int, text: str, headings: List[str] = None):
        self.page_number = page_number
        self.text = text
        self.headings = headings or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "page_number": self.page_number,
            "text": self.text,
            "headings": self.headings,
        }

class DocumentParser:
    @staticmethod
    def parse_file(file_path: str, file_type: str) -> List[ParsedPage]:
        ext = Path(file_path).suffix.lower()
        if ext == ".pdf":
            return DocumentParser._parse_pdf(file_path)
        elif ext in [".docx", ".doc"]:
            return DocumentParser._parse_docx(file_path)
        elif ext in [".txt", ".md"]:
            return DocumentParser._parse_text_or_markdown(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    @staticmethod
    def _parse_pdf(file_path: str) -> List[ParsedPage]:
        pages = []
        # Attempt PyMuPDF first
        try:
            import fitz
            doc = fitz.open(file_path)
            for i, page in enumerate(doc):
                raw_text = page.get_text("text")
                text = clean_extracted_text(raw_text)
                # Detect potential headings (lines starting with # or all caps or short lines)
                headings = []
                lines = [line.strip() for line in text.split("\n") if line.strip()]
                for line in lines[:5]:
                    if (len(line) < 80 and (line.isupper() or re.match(r"^[0-9]+(\.[0-9]+)*\s+[A-Z]", line))):
                        headings.append(line)
                pages.append(ParsedPage(page_number=i + 1, text=text, headings=headings))
            doc.close()
            return pages
        except Exception as e:
            # Fallback to pypdf if PyMuPDF encounters an issue
            try:
                import pypdf
                reader = pypdf.PdfReader(file_path)
                for i, page in enumerate(reader.pages):
                    raw_text = page.extract_text() or ""
                    text = clean_extracted_text(raw_text)
                    pages.append(ParsedPage(page_number=i + 1, text=text, headings=[]))
                return pages
            except Exception as e2:
                raise RuntimeError(f"Failed to parse PDF document: {str(e)} / {str(e2)}")

    @staticmethod
    def _parse_docx(file_path: str) -> List[ParsedPage]:
        try:
            import docx
            doc = docx.Document(file_path)
            pages = []
            current_page_text = []
            current_headings = []
            page_num = 1
            char_count = 0

            for para in doc.paragraphs:
                raw_text = para.text.strip()
                text = clean_extracted_text(raw_text)
                if not text:
                    continue

                if para.style and para.style.name and "Heading" in para.style.name:
                    current_headings.append(text)

                current_page_text.append(text)
                char_count += len(text)

                # Approximate page breaks every ~3000 chars for docx
                if char_count > 3000:
                    pages.append(ParsedPage(
                        page_number=page_num,
                        text="\n\n".join(current_page_text),
                        headings=list(current_headings)
                    ))
                    page_num += 1
                    current_page_text = []
                    current_headings = []
                    char_count = 0

            if current_page_text or not pages:
                pages.append(ParsedPage(
                    page_number=page_num,
                    text="\n\n".join(current_page_text),
                    headings=list(current_headings)
                ))

            return pages
        except Exception as e:
            raise RuntimeError(f"Failed to parse DOCX document: {str(e)}")

    @staticmethod
    def _parse_text_or_markdown(file_path: str) -> List[ParsedPage]:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = clean_extracted_text(f.read())

            pages = []
            # Split markdown by top-level headers (# or ##) or 3000 character chunks
            sections = re.split(r"\n(?=#{1,3}\s)", content)
            if len(sections) <= 1:
                # Split roughly into pages of ~3000 characters
                lines = content.split("\n")
                current_text = []
                current_len = 0
                page_idx = 1
                for line in lines:
                    current_text.append(line)
                    current_len += len(line)
                    if current_len >= 2500:
                        pages.append(ParsedPage(page_number=page_idx, text="\n".join(current_text), headings=[]))
                        page_idx += 1
                        current_text = []
                        current_len = 0
                if current_text or not pages:
                    pages.append(ParsedPage(page_number=page_idx, text="\n".join(current_text), headings=[]))
            else:
                for idx, sec in enumerate(sections):
                    lines = sec.strip().split("\n")
                    heading = lines[0].lstrip("#").strip() if lines else ""
                    pages.append(ParsedPage(
                        page_number=idx + 1,
                        text=sec.strip(),
                        headings=[heading] if heading else []
                    ))

            return pages
        except Exception as e:
            raise RuntimeError(f"Failed to parse text document: {str(e)}")
