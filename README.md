# Expense Tracker – Full-Stack & DevOps CI/CD Project

## Architecture
- **Frontend:** React + Vite (served via Nginx in production container)
- **Backend:** Node.js + Express REST API
- **Database:** MySQL 8.4
- **Infrastructure & CI/CD:** Docker, Docker Compose (with container healthchecks), GitHub Actions CI, Render Blueprint (`render.yaml`)

## Main Features
- Add income or expense transactions
- Edit and delete transactions with real-time summary recalculation
- View total income, total expenses, and current balance
- Health check endpoint (`GET /api/health` returning `{"ok": true}`)

---

## Run Local Without Docker
1. **Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## Run With Docker Compose
1. Copy environment file:
   ```powershell
   Copy-Item .env.example .env -Force
   ```
2. Build and start all containers:
   ```bash
   docker compose up -d --build
   ```
3. Check running containers and logs:
   ```bash
   docker compose ps
   docker compose logs --tail 50 backend
   ```

### Service URLs
- **Frontend (Nginx):** http://localhost:8080
- **Backend Health Check:** http://localhost:3000/api/health
- **MySQL Database:** `localhost:3307`

---

## Continuous Integration (GitHub Actions)
The automated CI pipeline (`.github/workflows/ci.yml`) runs on every `push` and `pull_request` across both `backend` and `frontend`:
- Install dependencies (`npm ci` with npm cache)
- Code linting (`npm run lint`)
- Automated tests (`npm run test`)
- Production build verification (`npm run build`)

---

## Cloud Deployment (Render Blueprint)
This repository includes a declarative `render.yaml` blueprint for automated deployment on Render:
1. Connect GitHub repository `thinhdang1104/DevOps2` in Render Blueprint dashboard.
2. Configure `DATABASE_URL` (`mysql://<user>:<password>@<host>:3306/<database>`) on the backend service.
3. Set `VITE_API_BASE_URL` on the frontend service to point to the deployed backend API URL.
