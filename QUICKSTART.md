# Quick start

This repo ships two parts:

- **Meetza Backend** — Node.js (Express + Socket.IO) on port **4000** by default  
- **`python-ai-service`** — FastAPI video/PDF summarization on port **8000** (needed if you use summarization features)

---

## Architecture Highlights (Deployment-Ready)

This repository includes several advanced optimizations for reliable production deployment:

- **⚡ Optimized AI Startup**: Implements **Lazy Loading** and **Background Initialization** for heavy AI models (Whisper/ONNX). This prevents the server from blocking during startup and ensures instant availability.
- **🔗 Intelligent Service Orchestration**: Uses **Docker Health Checks** to ensure the Backend only starts communicating with the AI service once it is fully ready, eliminating connection errors.
- **🛠 Robust Error Handling**: Automated fallback mechanisms for API connections ensure stability even if environment variables are missing.
- **📂 Smart Containerization**: Optimized `start.sh` logic to intelligently handle database connections based on the deployment environment.

---

## Prerequisites

### For local development

- Node.js **18+** recommended (Dockerfile uses Node 18)
- **MySQL 8** (or compatible), with schema loaded from `database_schema.sql`
- **FFmpeg** (already in the Python Docker image; required on the host if you run `python-ai-service` locally — see [`python-ai-service/README.md`](./python-ai-service/README.md))

### For Docker

- [Docker](https://docs.docker.com/get-docker/) with Docker Compose v2 (`docker compose …`)

---

## 0. Clone the project

First, clone the repository to your local machine:

```bash
git clone https://github.com/Soliman72/Meetza-Backend.git
cd Meetza-Backend
```

---

## Option A — Docker (backend + MySQL + Python AI)

Runs **MySQL**, **`summarize-api`** (FastAPI under `python-ai-service`), and **`backend`** together.

1. From the repo root, create **`.env`** with at least:

   ```env
   JWT_SECRET=your_secret
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   CALLBACK_URL=http://localhost:4000/api/auth/social/google/callback

   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...

   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=...
   EMAIL_PASS=...
   ```

   **Summarization (optional but recommended)** — same key must be accepted by FastAPI (`API_KEY`) and sent by Node (`SUMMARIZE_API_KEY`). If omitted, Compose uses a shared dev default (`dev-meetza-summarize-key`):

   ```env
   SUMMARIZE_API_KEY=your_strong_random_key

   WHISPER_MODEL_SIZE=base
   SUMMARIZE_API_PORT=8000
   SUMMARIZE_API_TIMEOUT_MS=1800000
   ```

2. Build and start:

   ```bash
   docker compose up -d --build
   ```

   Or: `npm run docker:build`

3. URLs

   | Service        | URL |
   |----------------|-----|
   | REST + Socket.IO | `http://localhost:4000` (or `PORT` from `.env` for host mapping) |
   | AI API + `/docs` | `http://localhost:8000` |

4. Verification

   Check the status of your containers:
   ```bash
   docker ps
   ```
   Wait until `meetza-summarize-api` shows `(healthy)`. You can also check the logs to see the health checks passing:

   ```bash
   docker compose logs -f summarize-api
   ```
   You should see regular health pings confirming the service is ready:
   `INFO: 127.0.0.1:XXXXX - "GET /health HTTP/1.1" 200 OK`

5. Logs

   ```bash
   docker compose logs -f backend
   docker compose logs -f summarize-api
   ```

6. Stop

   ```bash
   docker compose down
   ```

**Note:** Compose sets `SUMMARIZE_API_URL` and `SUMMARIZE_PDF_API_URL` to internal hostnames (`http://summarize-api:8000/...`). Do not point those to `127.0.0.1` inside the backend container — that will not reach the AI service.

**Public tunnel (optional):**

```bash
docker compose -f docker-compose.yml -f docker-compose.ngrok.yml up -d
```

(Requires `ngrok.yml`; see repo comments in `docker-compose.ngrok.yml`.)

---

## Option B — Local (no Docker)

You run **MySQL**, **Python AI**, and **Node** yourself.

### 1. Database

Install MySQL, create DB `meetza`, then import schema:

```bash
mysql -u root -p < database_schema.sql
```

### 2. Backend (Node)

```bash
npm install
```

Create `.env` in the **repo root** (same blocks as Docker, but **DB_HOST=localhost** and email variable **`EMAIL_PASS`**, not `EMAIL_PASSWORD`). Add summarization endpoints pointing at **your machine**:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=meetza

JWT_SECRET=...
# ...OAuth, Cloudinary, email — same idea as Docker section...

SUMMARIZE_API_URL=http://127.0.0.1:8000/summarize_video
SUMMARIZE_PDF_API_URL=http://127.0.0.1:8000/summarize_pdf
SUMMARIZE_API_KEY=your_strong_random_key
```

Start:

```bash
npm run dev
```

(or `npm start`)

### 3. Python AI service (`python-ai-service`)

Open a **second** terminal:

```bash
cd python-ai-service
python -m venv .venv

# Windows
.\.venv\Scripts\activate
# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
```

Copy **`python-ai-service/.env.example`** to **`python-ai-service/.env`** and set **`API_KEY`** to the **same value** as root **`SUMMARIZE_API_KEY`**.

Ensure FFmpeg (and PDF/OCR tooling) is installed — see **`python-ai-service/README.md`**.

Run:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Swagger: `http://localhost:8000/docs`

---

## Troubleshooting

- **Docker build slow on first run:** the `summarize-api` image installs heavy deps (including Whisper-related stacks); later builds use cache.
- **`403` from summarization:** `X-API-Key` mismatches root `SUMMARIZE_API_KEY` vs `python-ai-service` `API_KEY`.
- **`ECONNREFUSED` to summarization URLs in Docker:** use Compose defaults for those URLs inside containers; never `127.0.0.1` for backend → AI when both are in Compose.

Full project documentation stays in **`README.md`**.
