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
