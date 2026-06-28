# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack World Cup prediction app where users pick knockout match winners, save predictions, and compete on a leaderboard. Stack: React + Vite frontend, FastAPI backend, Supabase for auth and database.

## Commands

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # first time only
pip install -r requirements.txt                     # first time only
uvicorn app.main:app --reload                       # runs on http://localhost:8000
```

Requires `backend/.env` (copy from `backend/.env.example`) with `SUPABASE_URL` and `SUPABASE_KEY`.

### Frontend
```bash
cd frontend
npm install        # first time only
npm run dev        # runs on http://localhost:5173
npm run build
```

## Architecture

**Frontend** (`frontend/src/`): React 18 SPA with React Router v6. Pages map directly to routes:
- `/` → `Home`, `/register` → `Register`, `/predictions` → `Predictions`, `/leaderboard` → `Leaderboard`, `/teams` → `TeamStats`
- `Navbar` is the only shared component.
- Vite proxies `/api/*` → `http://localhost:8000` in dev, so frontend uses `/api/...` paths without hardcoding the backend URL.

**Styling**: Tailwind CSS with a custom brand palette — `pitch` (dark green) and `gold` (yellow) color tokens defined in `tailwind.config.js`. The app background is `bg-gray-950`. Animations use Framer Motion.

**Backend** (`backend/app/`): FastAPI with a router-per-feature pattern under `app/routers/`. Currently only the `health` router (`GET /api/health`) exists. New feature routers should be created in `app/routers/` and registered in `app/main.py` with an `/api` prefix.

**Database**: Supabase client is initialized once in `app/db/supabase_client.py` and should be imported from there. The client reads `SUPABASE_URL` and `SUPABASE_KEY` from environment at startup — missing vars raise a `KeyError` immediately.

**CORS**: The backend allows only `http://localhost:5173`. Add production origins here when deploying.
