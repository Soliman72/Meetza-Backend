import asyncio
import os
import urllib.request
import uuid
from typing import Optional

import ffmpeg
from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.core.config import DEFAULT_SUMMARY_RATIO
from app.core.security import verify_api_key
from app.services.summarization import extract_topics, extractive_summary
from app.services.transcription import transcribe_audio

router = APIRouter()


@router.post("/summarize_video/{video_id}")
async def summarize_video(
    video_id: str,
    file: Optional[UploadFile] = File(None),
    url: Optional[str] = Form(None),
    x_localization: str = Header(default="ar", alias="X-Localization"),
    _: None = Depends(verify_api_key),
):
    """
    Summarize video or audio content from an uploaded file or a public URL.

    Process:
    1. Download or save the input file.
    2. Extract audio using FFmpeg.
    3. Transcribe audio using faster-whisper.
    4. Generate extractive summary and extract topics.
    5. Clean up temporary files.

    Args:
        video_id (str): User-provided identifier for the session.
        file (UploadFile, optional): Uploaded video/audio file.
        url (str, optional): Publicly accessible URL to a video/audio file.
        x_localization (str): 'ar' for Arabic or 'en' for English.
        _ (None): API Key verification dependency.

    Returns:
        dict: A dictionary containing the language, transcript, summary, and topics.

    Raises:
        HTTPException: For invalid inputs, processing errors, or missing files.
    """
    if not file and not url:
        raise HTTPException(status_code=400, detail="Must provide either a 'file' or a 'url'")

    lang = x_localization.lower()
    if lang not in ("ar", "en"):
        raise HTTPException(status_code=400, detail="X-Localization must be 'ar' or 'en'")

    uid = str(uuid.uuid4())
    filename_from_req = file.filename if file and getattr(file, "filename", None) else "downloaded_video.mp4"
    video_path = f"temp_{uid}_{filename_from_req}"
    audio_path = f"temp_{uid}.wav"

    try:
        if file:
            file_content = await file.read()
            with open(video_path, "wb") as buf:
                buf.write(file_content)
        elif url:
            def download_file():
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req) as response, open(video_path, "wb") as out_file:
                    out_file.write(response.read())
            await asyncio.to_thread(download_file)

        (
            ffmpeg
            .input(video_path)
            .output(audio_path, acodec="pcm_s16le", ac=1, ar="16000")
            .overwrite_output()
            .run(quiet=True)
        )

        transcript = transcribe_audio(audio_path, language=lang)

        if not transcript:
            response_data = {"language": lang, "transcript": "", "summary": "لم يُكتشف كلام في الفيديو."}
            return JSONResponse(status_code=200, content=response_data)

        summary = extractive_summary(transcript, lang=lang, ratio=DEFAULT_SUMMARY_RATIO)
        topics = extract_topics(transcript, max_topics=8)

        return {
            "language": lang,
            "transcript": transcript,
            "summary": summary,
            "topics": topics,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
    finally:
        for path in (video_path, audio_path):
            if os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass

