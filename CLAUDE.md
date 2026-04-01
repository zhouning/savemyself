# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SaveMyself is a multi-tenant SaaS platform for chronic rhinitis management combining symptom tracking, environmental data collection, and AI analysis. The stack is FastAPI (backend) + Next.js (frontend) + PostgreSQL, deployed on Google Cloud Run.

## Development Commands

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev  # Runs on port 3000
npm run build
npm run start
```

### Docker Build
```bash
# Backend
cd backend && docker build -t savemyself-backend .

# Frontend
cd frontend && docker build -t savemyself-frontend .
```

## Architecture

### Backend Structure (`/backend/app/`)

**Core modules:**
- `main.py` - FastAPI app with OAuth2 JWT authentication, all API routes
- `models.py` - SQLAlchemy models: User, DailyLog (40+ fields), LoginAudit
- `schemas.py` - Pydantic request/response schemas
- `database.py` - PostgreSQL connection via SQLAlchemy
- `auth.py` - bcrypt password hashing, JWT token generation (7-day expiration)
- `ai_engine.py` - Google Gemini API integration for symptom analysis
- `environmental_service.py` - Weather/AQI data fetching (QWeather + OpenWeatherMap)

**Multi-tenancy:** All database queries MUST filter by `user_id` to enforce user isolation. The `get_current_user` dependency provides the authenticated user.

**Authentication flow:**
1. POST `/token` with username/password → returns JWT access token
2. All protected endpoints require `Authorization: Bearer <token>` header
3. `get_current_user` dependency validates token and returns User object

### Frontend Structure (`/frontend/src/`)

**Pages (`app/`):**
- `page.tsx` - Daily check-in form (symptoms, environment, lifestyle, interventions)
- `login/page.tsx` - Authentication
- `register/page.tsx` - User registration
- `history/page.tsx` - View/edit past logs
- `ai/page.tsx` - AI analysis results
- `admin/page.tsx` - Admin dashboard (role-gated)

**Key utilities:**
- `lib/api.ts` - Authenticated fetch wrapper with automatic token injection
- `components/Navigation.tsx` - Header navigation component

**API communication:** All API calls go through `lib/api.ts` which handles token management and error handling.

### Database Schema

**User table:**
- Authentication: email, hashed_password
- Profile: rhinitis_years, symptoms, allergens, occupation, location
- Role: is_admin flag

**DailyLog table (40+ fields):**
- Symptoms: nasal_congestion, runny_nose, sneezing, itchiness (0-10 scale)
- Environment: temperature, humidity, PM2.5, PM10, NO2, O3, CO, SO2, AQI, pressure, wind_speed, precipitation
- Lifestyle: sleep_quality, stress_level, exercise_minutes, diet_notes
- Interventions: medications, nasal_wash, other_treatments
- Indoor: pet_contact, indoor_ventilation, indoor_dust
- Geolocation: latitude, longitude

**LoginAudit table:**
- Tracks login attempts with IP, user-agent, success/failure

## Environment Variables

### Backend (`.env`)
```
DATABASE_URL=postgresql://user:password@host:port/dbname
GEMINI_API_KEY=your_gemini_api_key_here
ENVIRONMENT=development
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Key Patterns

### Adding a new API endpoint
1. Define Pydantic schemas in `schemas.py`
2. Add route in `main.py` with `get_current_user` dependency
3. Filter queries by `current_user.id` for multi-tenant isolation
4. Update frontend `lib/api.ts` if needed

### Adding a new DailyLog field
1. Add column to `models.DailyLog` (SQLAlchemy model)
2. Update `schemas.DailyLogCreate` and `schemas.DailyLog` (Pydantic)
3. Create Alembic migration: `alembic revision --autogenerate -m "description"`
4. Apply migration: `alembic upgrade head`
5. Update frontend form in `app/page.tsx`

### Environmental data sources
- **QWeather API**: Used for locations in China (primary)
- **OpenWeatherMap**: Fallback for global locations
- Data fetched via `environmental_service.py` and stored in DailyLog

### AI Analysis
- Triggered via POST `/ai/analyze` endpoint
- Fetches user's DailyLog history
- Sends to Gemini API with prompt for symptom-trigger correlation
- Returns structured analysis results

## Deployment

Both services deploy to Google Cloud Run as Docker containers:
- Backend listens on port 8080
- Frontend listens on port 3000
- Frontend proxies `/api/*` requests to backend via `next.config.mjs`

## Security Notes

- JWT tokens expire after 7 days (configurable in `auth.py`)
- All passwords hashed with bcrypt
- User isolation enforced at query level (always filter by user_id)
- Admin endpoints check `current_user.is_admin`
- Login attempts logged to LoginAudit table with IP tracking
