import json
from io import BytesIO
from pathlib import Path

from docx import Document
from pypdf import PdfReader


TEXT_EXTENSIONS = {".txt", ".md", ".markdown", ".json"}
DOCUMENT_EXTENSIONS = TEXT_EXTENSIONS | {".docx", ".pdf"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}
ALLOWED_EXTENSIONS = DOCUMENT_EXTENSIONS | IMAGE_EXTENSIONS


def extract_text(filename: str, content: bytes) -> tuple[str, str]:
    extension = Path(filename).suffix.lower()
    if extension in {".txt", ".md", ".markdown"}:
        return content.decode("utf-8", errors="replace"), "ready"
    if extension == ".json":
        parsed = json.loads(content.decode("utf-8"))
        return json.dumps(parsed, ensure_ascii=False, indent=2), "ready"
    if extension == ".docx":
        document = Document(BytesIO(content))
        return "\n".join(paragraph.text for paragraph in document.paragraphs), "ready"
    if extension == ".pdf":
        reader = PdfReader(BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages), "ready"
    if extension in IMAGE_EXTENSIONS:
        return "", "ocr_pending"
    raise ValueError("unsupported_file_type")
