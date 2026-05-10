from faster_whisper import WhisperModel

from app.core.config import WHISPER_COMPUTE, WHISPER_DEVICE, WHISPER_MODEL_SIZE

_whisper_model = None

def get_model():
    global _whisper_model
    if _whisper_model is None:
        print(f"[startup] Loading Whisper '{WHISPER_MODEL_SIZE}' on {WHISPER_DEVICE} ...")
        _whisper_model = WhisperModel(
            WHISPER_MODEL_SIZE,
            device=WHISPER_DEVICE,
            compute_type=WHISPER_COMPUTE,
        )
        print("[startup] Whisper ready ✓")
    return _whisper_model


def transcribe_audio(audio_path: str, language: str) -> str:
    """
    Transcribe an audio file using the faster-whisper model.

    Args:
        audio_path (str): Path to the .wav audio file.
        language (str): Language code ('ar' for Arabic, 'en' for English).

    Returns:
        str: The full transcribed text.
    """
    segments, _ = get_model().transcribe(
        audio_path,
        language=language,
        beam_size=5,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
        condition_on_previous_text=True,
    )
    text = " ".join(seg.text.strip() for seg in segments)
    return text.strip()

