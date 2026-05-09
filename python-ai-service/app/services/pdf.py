def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract all text from a PDF file.

    Uses `pdfplumber` as the primary extractor and falls back to `pypdf` if 
    `pdfplumber` fails or returns empty text.

    Args:
        pdf_path (str): The local path to the PDF file.

    Returns:
        str: The extracted text content.

    Raises:
        RuntimeError: If both extraction methods fail.
    """
    text = ""

    try:
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            pages_text = []
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    pages_text.append(page_text.strip())
            text = "\n".join(pages_text)
    except Exception as e:
        print(f"[pdf] pdfplumber failed: {e}, trying pypdf fallback ...")

    if not text.strip():
        try:
            from pypdf import PdfReader
            reader = PdfReader(pdf_path)
            pages_text = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    pages_text.append(page_text.strip())
            text = "\n".join(pages_text)
        except Exception as e:
            raise RuntimeError(f"Could not extract text from PDF: {e}")

    return text.strip()

