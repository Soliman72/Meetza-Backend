import os
from dotenv import load_dotenv

load_dotenv()

# Keep default key aligned with previous behavior for backward compatibility.
API_KEY = os.getenv("API_KEY", "#$$0limaaaannnn##sddsdsd23233522dd")

WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "medium")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE = os.getenv("WHISPER_COMPUTE", "int8")
WHISPER_CACHE_DIR = os.getenv("WHISPER_CACHE_DIR", "/app/cache")

# Summarization Settings
DEFAULT_SUMMARY_RATIO = float(os.getenv("DEFAULT_SUMMARY_RATIO", "0.3"))

