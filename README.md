# <p align="center">🚀 Meetza - The Ultimate Educational Ecosystem</p>

<p align="center">
  <img src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  <img src="https://img.shields.io/badge/Batch-2025-blue" />
  <img src="https://img.shields.io/badge/License-ISC-orange" />
  <img src="https://img.shields.io/badge/AI-Integrated-red" />
</p>

---

## 📖 Overview
**Meetza** is a robust, production-ready ecosystem designed to streamline educational and corporate collaboration. By merging **Real-time Communication** with **Generative AI**, Meetza provides an all-in-one platform for managing groups, meetings, and AI-driven content analysis.

---

## 📑 Table of Contents
- [🌟 Key Features](#-key-features)
- [🛠 Tech Stack](#-tech-stack)
- [🤖 AI Innovations](#-ai-innovations)
- [🚀 Getting Started](#-getting-started)
- [🔌 API Reference](#-api-reference)
- [📂 Architecture](#-architecture)
- [🤝 Authors](#-authors)

---

## 🌟 Key Features

### 🔐 Secure Authentication
- **Social Login**: Integrated with Google, LinkedIn, and Facebook OAuth.
- **JWT Protection**: Secure, token-based authentication for all endpoints.
- **Role-Based Access (RBAC)**: Fine-grained permissions (Super Admin, Instructor, Student).

### 👥 Group & Content Management
- **Dynamic Workspaces**: Create groups for departments, classes, or projects.
- **Resource Hub**: Centralized sharing for documents, videos, and meeting recordings.

### 💬 Real-time Engagement
- **Instant Messaging**: Group chats with Socket.io support.
- **Smart Notifications**: Real-time alerts for meetings and updates.

---

## 🤖 AI Innovations

| Feature | Technology | Description |
| :--- | :--- | :--- |
| **Smart Chatbot** | Google Gemini 1.5 Flash | Role-aware AI assistant supporting Arabic & English. |
| **Video Summaries** | Whisper + Python AI | Transcribes and extracts key points from recorded lectures. |
| **PDF Analyzer** | FastAPI + NLP | Summarizes complex PDF documents in seconds. |

---

## 🛠 Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Core** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) ![Express](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white) |
| **Database** | ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white) |
| **AI & NLP** | ![Gemini](https://img.shields.io/badge/Gemini%20AI-8E75B2?style=flat-square&logo=google&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white) |
| **Real-time** | ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socketdotio&logoColor=white) |
| **Storage** | ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white) |

---

## 🔌 API Reference (Core Backend)

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT |

### Group Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/group` | List all available groups |
| `POST` | `/api/group` | Create a new group (Admin only) |

### AI Assistant
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/chatbot/chat` | Send a message to Gemini AI |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js v18+
- MySQL Server
- Python 3.9+ (for AI Service)

### 2. Environment Configuration
Create a `.env` file from the template:
```bash
cp .env.example .env
```

### 3. Deployment (Docker)
```bash
docker compose up -d --build
```

---

## 📂 Architecture
The project follows a **Layered Service-Repository Pattern**, ensuring separation of concerns and high scalability.

```text
├── src/
│   ├── controller/      # Handling Requests/Responses
│   ├── services/        # Business Logic & Orchestration
│   ├── repository/      # Data Persistence (SQL)
│   ├── sockets/         # Real-time Events
│   └── utils/           # Shared AI & File Utilities
├── python-ai-service/   # Dedicated AI Microservice
└── database_schema.sql  # Database structure
```

---

## 🤝 Authors
- **Meetza Development Team**
- Graduation Project - 2025

---

## 📄 License
This project is licensed under the ISC License.
