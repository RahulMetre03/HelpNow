# 🧠 HelpNow — AI-Assisted Mental Health Continuity Platform

A full-stack platform bridging the gap between therapy sessions with empathetic AI chat support, appointment booking, and continuous care.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + Tailwind CSS |
| Backend | Python 3.12 + FastAPI |
| Database | PostgreSQL (Neon) |
| AI | Google Gemini API |
| Auth | JWT (bcrypt + python-jose) |

## Quick Start

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
```

Edit `.env` with your credentials:
```
DATABASE_URL=postgresql+asyncpg://user:pass@your-neon-host.neon.tech/helpnow?ssl=require
JWT_SECRET=your-random-secret-key
GEMINI_API_KEY=your-gemini-api-key
```

Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Features (MVP)

- ✅ User signup/login (patient & therapist roles)
- ✅ AI chat with Gemini (empathetic, 24/7)
- ✅ Appointment booking with therapists
- ✅ Role-aware dashboards
- ✅ Dark mode glassmorphism UI

## Project Structure

```
HelpNow/
├── backend/           # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── main.py
│   │   ├── models/    # 6 DB models
│   │   ├── routers/   # auth, chat, therapists, appointments
│   │   ├── schemas/   # Pydantic schemas
│   │   └── services/  # Auth + AI chat
│   └── requirements.txt
│
└── frontend/          # Next.js 14
    └── src/app/       # Landing, login, signup, dashboard, chat, appointments
```
