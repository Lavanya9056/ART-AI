# ART-AI

## AI-Powered Website Security Assessment Platform

ART-AI is a polished security operations demo platform with a FastAPI backend, a React/Vite frontend, JWT authentication, image generation support, and an operator-style dashboard experience.

## What is included

- Authentication flow for sign-in and registration
- Protected user profile route
- AI status and image generation endpoints
- Upload-serving support for generated assets
- Premium dashboard experience with overview, scanner, simulation, compliance, and copilot views

## Tech stack

- Frontend: React + Vite + Axios
- Backend: FastAPI + SQLAlchemy + Pydantic
- Auth: JWT + password hashing
- Storage: local upload directory and SQLite fallback by default

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn art_ai.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Environment

Create a copy of `.env.example` if you want to override defaults:

```bash
cp .env.example .env
```

## Verification

The current project has been verified with:

- Backend tests: `python -m pytest -q`
- Frontend build: `npm run build`

## Version
0.1.0