import asyncio
import os
import urllib.request
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.core.config import DEFAULT_SUMMARY_RATIO
from app.core.security import verify_api_key
from app.services.pdf import extract_text_from_pdf
from app.services.summarization import extract_topics, extractive_summary

router = APIRouter()


@router.post("/summarize_pdf")
async def summarize_pdf(
    file: Optional[UploadFile] = File(None),
    url: Optional[str] = Form(None),
    x_localization: str = Header(default="ar", alias="X-Localization"),
    summary_ratio: float = Form(default=DEFAULT_SUMMARY_RATIO),
    _: None = Depends(verify_api_key),
):
    """
    Extract text and summarize a PDF document from an uploaded file or URL.

    Process:
    1. Download or save the PDF file.
    2. Extract text using pdfplumber/pypdf.
    3. Calculate page count and character count.
    4. Generate extractive summary and extract topics.
    5. Clean up temporary files.

    Args:
        file (UploadFile, optional): Uploaded .pdf file.
        url (str, optional): Publicly accessible URL to a .pdf file.
        x_localization (str): 'ar' for Arabic or 'en' for English.
        summary_ratio (float): Ratio of sentences to include in the summary (0.05 to 1.0).
        _ (None): API Key verification dependency.

    Returns:
        dict: A dictionary containing language, page count, character count, text, summary, and topics.

    Raises:
        HTTPException: For invalid inputs, invalid file types, or processing errors.
    """
    if not file and not url:
        raise HTTPException(status_code=400, detail="Must provide either a 'file' or a 'url'")

    lang = x_localization.lower()
    if lang not in ("ar", "en"):
        raise HTTPException(status_code=400, detail="X-Localization must be 'ar' or 'en'")

    if not (0.05 <= summary_ratio <= 1.0):
        raise HTTPException(status_code=400, detail="summary_ratio must be between 0.05 and 1.0")

    uid = str(uuid.uuid4())
    pdf_path = f"temp_{uid}.pdf"

    try:
        if file:
            if not file.filename.lower().endswith(".pdf"):
                raise HTTPException(status_code=400, detail="Uploaded file must be a .pdf")
            content = await file.read()
            with open(pdf_path, "wb") as f:
                f.write(content)
        else:
            def download_pdf():
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=30) as resp, open(pdf_path, "wb") as out:
                    out.write(resp.read())
            await asyncio.to_thread(download_pdf)

        try:
            from pypdf import PdfReader as _PdfReader
            page_count = len(_PdfReader(pdf_path).pages)
        except Exception:
            page_count = -1

        full_text = extract_text_from_pdf(pdf_path)

        if not full_text:
            no_text_msg = (
                "لم يتم العثور على نص قابل للاستخراج في هذا الملف. "
                "قد يكون الملف ممسوحاً ضوئياً (scanned). يُرجى استخدام نسخة نصية."
                if lang == "ar" else
                "No extractable text found in this PDF. "
                "The file may be a scanned image. Please provide a text-based PDF."
            )
            return JSONResponse(
                status_code=200,
                content={
                    "language": lang,
                    "page_count": page_count,
                    "char_count": 0,
                    "text": "",
                    "summary": no_text_msg,
                    "topics": [],
                },
            )

        summary = extractive_summary(full_text, lang=lang, ratio=summary_ratio)
        topics = extract_topics(full_text, max_topics=8)

        return {
            "language": lang,
            "page_count": page_count,
            "char_count": len(full_text),
            "text": full_text,
            "summary": summary,
            "topics": topics,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF processing error: {str(e)}")
    finally:
        if os.path.exists(pdf_path):
            try:
                os.remove(pdf_path)
            except Exception:
                pass

