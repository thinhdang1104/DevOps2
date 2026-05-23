# Expense Tracker - DevOps Project

## Architecture
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL

## Mandatory Endpoint
- GET /api/health returns { "ok": true }

## Main Features
- Add income or expense transaction
- List transactions
- Delete transaction
- View totals and balance

## Run Local Without Docker
1. Backend
   - cd backend
   - npm install
   - npm run dev
2. Frontend
   - cd frontend
   - npm install
   - npm run dev

## Run With Docker (Required)
1. Copy environment file
   - Copy-Item .env.example .env -Force
2. Build and start
   - docker compose up -d --build
3. Check running containers
   - docker compose ps
4. Check logs
   - docker compose logs --tail 50 backend
   - docker compose logs --tail 50 frontend
   - docker compose logs --tail 50 db

### URLs
- Frontend: http://localhost:8080
- Backend health: http://localhost:3000/api/health
- MySQL: localhost:3307

## CI
GitHub Actions pipeline runs on push and pull request.
- install dependencies
- lint
- test
- build

Workflow file: .github/workflows/ci.yml

## Deploy Production On Render
This repo includes render.yaml for one-click blueprint deploy.
For MySQL on Render, use an external MySQL provider and set DATABASE_URL manually.

### A. Deploy backend + frontend
1. Go to Render dashboard
2. New + -> Blueprint
3. Connect GitHub repo: thinhdang1104/DevOps2
4. Select branch: main
5. Deploy blueprint

### B. Set backend DATABASE_URL (MySQL)
Use MySQL connection string format:
- mysql://<user>:<password>@<host>:3306/<database>

### C. Update frontend API URL after first deploy
After backend service is created, copy backend public URL.
Set frontend env var:
- VITE_API_BASE_URL = https://<your-backend-service>.onrender.com/api

Then trigger a redeploy of frontend service.

## Production Verification Checklist (Required)
Use this checklist after deploy to prove the system works end to end.

1. Health check is up
   - Open: https://<your-backend-service>.onrender.com/api/health
   - Expected JSON contains: {"ok": true}

2. API CRUD flow works
   - Create transaction (POST /api/transactions)
   - Read list (GET /api/transactions)
   - Read summary (GET /api/transactions/summary)
   - Delete one transaction (DELETE /api/transactions/:id)

3. Frontend to backend integration is correct
   - Open frontend URL and verify API Status shows Online
   - Add one transaction on UI and confirm it appears in list
   - Verify total income/expense/balance updates immediately

4. Database connection is stable
   - Backend logs must not show DB connection errors
   - Data remains after service restart

5. CI status is green
   - Latest GitHub Actions run passes install, lint, test, build for backend and frontend

### Submission Evidence
Capture and attach these artifacts for final submission:
- Screenshot of /api/health response
- Screenshot of frontend with at least one real transaction
- Screenshot of CI workflow success
- Short incident notes for at least 2 production issues and fixes

## Incident Report Template (Required)
For each incident, record:
- Symptom
- Error layer (L4/L3/L2/L1)
- Root cause
- Fix
- Prevention

## Suggested 3 Incidents
1. Wrong DATABASE_URL causes backend 500
2. Wrong VITE_API_BASE_URL causes frontend fetch error
3. Missing CORS configuration causes blocked browser request
