# Deploy MGSULBAR to Render

This app has two parts:

1. **Frontend** – Vite + React (static build)
2. **Backend** – Node.js Express API in `server/`

On Render you can use either:

- **Option A:** One **Web Service** that runs the API and serves the built frontend (simplest).
- **Option B:** **Static Site** for the frontend + **Web Service** for the API (two services).

Below is **Option A** (single Web Service). For Option B, create a Static Site for the root build and a Web Service for `server/`, and point the frontend env to the API URL.

---

## Step 1: Push code to GitHub

1. Create a repo at [https://github.com/akbartantu/mgsulbar](https://github.com/akbartantu/mgsulbar) if you haven’t (it can be empty).
2. In your project folder:

```bash
git init
git remote add origin https://github.com/akbartantu/mgsulbar.git
git add .
git commit -m "Initial commit: MGSULBAR app with CI/CD"
git branch -M main
git push -u origin main
```

Use a **Personal Access Token** or **SSH** if you use 2FA. Do **not** commit `.env`, `server/.env`, or `server/service-account.json`; they are in `.gitignore`.

---

## Step 2: Create a Render account and connect GitHub

1. Go to [https://render.com](https://render.com) and sign up (or log in).
2. Click **Dashboard** → **New** → **Web Service**.
3. Connect your GitHub account if needed and choose the **akbartantu/mgsulbar** repository.
4. Select the repo and continue.

---

## Step 3: Configure the Web Service (Option A – single service)

Use these settings:

| Field | Value |
|--------|--------|
| **Name** | `mgsulbar-api` (or any name) |
| **Region** | Choose closest to users |
| **Branch** | `main` |
| **Root Directory** | Leave empty |
| **Runtime** | `Node` |
| **Build Command** | See below |
| **Start Command** | See below |

**Build command:**

```bash
npm run render:build
```

(This runs: `npm ci` → `npm run build` → copy `dist/` to `server/public/` → `cd server && npm ci`.)

**Start command:**

```bash
npm run render:start
```

(This runs: `cd server && node index.js`. The server serves the API and, in production, static files from `server/public/`.)

---

## Step 4: Environment variables on Render

In the Render dashboard for your Web Service:

1. Open the service → **Environment**.
2. Add variables (use **Environment** or **Secret** as needed):

**Required for API:**

| Key | Value | Notes |
|-----|--------|--------|
| `NODE_ENV` | `production` | |
| `PORT` | (leave empty) | Render sets this |
| `FRONTEND_URL` | `https://your-render-url.onrender.com` | Your **own** Render service URL (no trailing slash). Replace after first deploy. |
| `JWT_SECRET` | (long random string) | e.g. `openssl rand -hex 32` |
| `ADMIN_EMAIL` | Your admin email | |
| `ADMIN_PASSWORD` | Strong password | |

**If using Google Sheets:**

| Key | Value |
|-----|--------|
| `GOOGLE_SHEETS_CREDENTIALS` | JSON string of service account (no file upload; paste content). |
| `SPREADSHEET_ID` | Your sheet ID |

**If using Google Sign-In:**

| Key | Value |
|-----|--------|
| `GOOGLE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |

Do **not** add `VITE_API_URL` here; that is for the **frontend** build (Step 5).

---

## Step 5: Build-time API URL (frontend)

So the frontend calls your Render API URL, set a **build-time** env var in Render:

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://your-render-url.onrender.com` |

Use your real Render service URL. You can set it after the first deploy, then trigger a **Redeploy** so the frontend is rebuilt with the correct API URL.

The repo already includes:

- **Build:** `npm run render:build` (builds frontend, copies to `server/public/`, installs server deps).
- **Start:** `npm run render:start` (runs the server; in production it serves `server/public/` as static files).

---

## Step 6: Use the Render Blueprint (optional)

A **Blueprint** is already in the repo: `render.yaml`. It defines one Web Service with the correct build/start commands.

1. Push your code to GitHub (Step 1).
2. Render Dashboard → **New** → **Blueprint**.
3. Connect the **akbartantu/mgsulbar** repo; Render will detect `render.yaml`.
4. Add the required env vars (e.g. `FRONTEND_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`; `JWT_SECRET` can be auto-generated).
5. Click **Apply** to create the service and deploy.

---

## Step 7: Deploy and set FRONTEND_URL

1. Trigger a deploy (push to `main` or **Manual Deploy**).
2. After the first deploy, copy the service URL (e.g. `https://mgsulbar-api.onrender.com`).
3. In **Environment** set:
   - `FRONTEND_URL` = `https://mgsulbar-api.onrender.com`
   - `VITE_API_URL` = `https://mgsulbar-api.onrender.com` (for the next build)
4. Redeploy so the new env is used.

---

## Step 8: HTTPS and CORS

- Render gives HTTPS. Use `https://` in `FRONTEND_URL` and `VITE_API_URL`.
- CORS is allowed for `FRONTEND_URL`; keep it exactly equal to the URL you use in the browser (no trailing slash is fine).

---

## Troubleshooting

- **502 / Service Unavailable:** Check **Logs**; often `PORT` or `JWT_SECRET` missing or server crash on startup.
- **CORS errors:** Ensure `FRONTEND_URL` matches the URL you open in the browser (including `https`).
- **API 404:** Ensure start command runs the server (e.g. `cd server && node index.js`) and that routes are under `/api`.
- **Blank frontend:** Ensure the server serves `dist/` (or `server/public/`) and that `VITE_API_URL` was set at **build** time and points to the same Render URL.

For more, see [Render Docs](https://render.com/docs) and the project’s `docs/troubleshooting-guide.md`.
