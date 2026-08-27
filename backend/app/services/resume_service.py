from io import BytesIO

from docx import Document
from pypdf import PdfReader


def extract_text(filename: str, content: bytes) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(content)).pages).strip()
    if lower.endswith(".docx"):
        return "\n".join(paragraph.text for paragraph in Document(BytesIO(content)).paragraphs).strip()
    if lower.endswith(".txt"):
        return content.decode("utf-8", errors="replace").strip()
    raise ValueError("Supported resume formats are PDF, DOCX, and TXT")
