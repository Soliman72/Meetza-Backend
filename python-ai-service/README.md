# Video & PDF Summarizer API 🎥 📄

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100.0+-009688.svg)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful, lightweight FastAPI service that provides AI-powered summarization for video, audio, and PDF documents. Optimized for both **Arabic (including Egyptian dialect)** and **English**.

---

## 🌟 Features

- **Multi-Format Support**: Summarize videos (upload/URL), audio, and PDF documents.
- **AI Transcription**: Powered by `faster-whisper` for high-accuracy speech-to-text.
- **Smart Summarization**: Lightweight extractive summarization that captures key points without heavy LLM costs.
- **Topic Extraction**: Automatically identifies key themes and keywords.
- **Bi-lingual**: Native support for Arabic and English via `X-Localization` header.
- **Developer Friendly**: Fully Dockerized, secure API key access, and detailed logging.

---

## 🏗️ Architecture

The system follows a modular architecture separating the API routes from the core business logic.

- **Frontend**: FastAPI (REST API)
- **Transcription**: `faster-whisper`
- **Audio Processing**: `ffmpeg`
- **PDF Extraction**: `pdfplumber` / `pypdf`
- **Logic**: Custom Extractive Summarizer

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed breakdown.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- **FFmpeg**: Required for video/audio processing.
  - Windows: `winget install ffmpeg`
  - Linux: `sudo apt install ffmpeg`
  - macOS: `brew install ffmpeg`

### Local Setup

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd python-ai-service
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # Linux/macOS
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configuration**:
   Create a `.env` file in the root directory:
   ```env
   API_KEY=your_secure_api_key
   WHISPER_MODEL_SIZE=base
   WHISPER_DEVICE=cpu
   ```

5. **Run the application**:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`. Documentation at `/docs`.

### Docker Setup

```bash
docker-compose up --build
```
> [!IMPORTANT]
> Keep the terminal open and wait until you see the `Application startup complete` message before trying to access the API.


---

## 📡 API Documentation

### Summarize Video
`POST /summarize_video/{video_id}`

**Headers:**
- `X-API-Key`: Your API key
- `X-Localization`: `ar` (default) or `en`

**Example Request (curl):**
```bash
curl -X POST "http://localhost:8000/summarize_video/123" \
     -H "X-API-Key: your_key" \
     -F "url=https://example.com/video.mp4"
```

### Summarize PDF
`POST /summarize_pdf`

**Form Data:**
- `file`: PDF file upload
- `summary_ratio`: (Optional) Float between 0.05 and 1.0 (default 0.3)

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
