# Troubleshooting Guide — MGSULBAR

Log of problems, causes, fixes, and verification steps. Update whenever issues or workarounds are discovered. Linked from [qa-testing-guide.md](qa-testing-guide.md) for known issues.

**Current implementation:** The app runs **without login**; all data is mock data. Auth and session issues below apply when auth and API are wired (target phase).

---

## 1. Auth and session (target phase)

### Problem: "Invalid credentials" when logging in with admin email/password

**Symptoms:** User enters ADMIN_EMAIL and ADMIN_PASSWORD from `.env` but receives "Invalid credentials" (401).

**Cause:** Server did not load `.env`; `process.env.ADMIN_EMAIL` and `process.env.ADMIN_PASSWORD` were undefined. Backend did not use `dotenv` at startup.

**Fix:** Add `dotenv` to server dependencies and load env at entry: in `server/index.js` add `import 'dotenv/config'` at the top; in `server/package.json` add `"dotenv": "^16.4.5"` (or similar) and run `npm install` in `server/`.

**Verification:** Restart backend; log in with admin credentials from `.env`; should succeed and redirect to dashboard.

---

### Problem: GET /api/me or GET /api/dashboard/stats returns 401 after login

**Symptoms:** Login succeeds (200, token returned), but subsequent requests to /api/me, /api/dashboard/stats, or /api/letters return 401 Unauthorized.

**Causes:**

1. **Token not sent:** Frontend made requests before the auth token getter was set (race: Dashboard/AppLayout queries ran before AuthContext set the token getter).
2. **Stale token:** Old token in sessionStorage from before server restart (e.g. new JWT_SECRET); server rejects token.

**Fixes:**

1. **Race:** Ensure authenticated API requests only run when user is set: add `enabled: !!user` (or `!!currentUser`) to TanStack Query calls that use the API (Dashboard, AppLayout, InboxPage, OutboxPage, DraftsPage, ApprovalsPage, ArchivePage, CreateLetterPage). After login, pass user from login/register response so no getMe() call is needed immediately.
2. **Stale token:** User clears sessionStorage (key `mgsulbar_token`) or logs out and logs in again.

**Verification:** Log in with valid credentials; dashboard and letter lists load without 401; Network tab shows `Authorization: Bearer <token>` on /api/dashboard/stats and /api/letters.

---

### Problem: Server log "jwt malformed" and GET /api/me or dashboard returns 401

**Symptoms:** Server terminal shows `[auth] JWT verify failed { errorMessage: 'jwt malformed' }`; browser gets 401 on /api/me, /api/dashboard/stats, or /api/letters.

**Cause:** The value sent in the `Authorization` header is not a valid JWT (a JWT has exactly three base64url segments separated by dots). Often caused by a stale or corrupted value in sessionStorage (e.g. an old Google ID token, stringified object, or leftover from a previous build).

**Fix:** Clear sessionStorage for key `mgsulbar_token` (DevTools → Application → Session Storage → remove the key) or log out and log in again so a fresh JWT from the login/register response is stored. The app now validates token shape on load and trims tokens when sending; if the issue persists, ensure only the `token` string from the API response is stored (not the whole response object).

**Verification:** After clearing storage and logging in again, dashboard and letter requests return 200; server no longer logs "jwt malformed".

---

### Problem: "Admin login not configured" (503) on POST /api/login

**Symptoms:** Backend returns 503 with message "Admin login not configured".

**Cause:** Old version of server code was running; that version returned 503 when ADMIN_EMAIL/ADMIN_PASSWORD were not set.

**Fix:** Ensure server is restarted after code/config changes; set ADMIN_EMAIL and ADMIN_PASSWORD in `server/.env` and load env with `dotenv/config`. Current code no longer returns 503 for this; it returns 401 "Invalid credentials" if admin check fails and sheet user lookup fails.

**Verification:** Restart server; POST /api/login with admin credentials returns 200 with token and user.

---

## 2. Data and API

### Create Google Sheet (database)

The app uses a single Google Spreadsheet as the database. The backend does **not** create the spreadsheet; you create it in Drive, then the backend creates the **tabs** (Users, Letters) and header rows when you call GET /api/setup (or on first data access).

**Steps:**

1. **Create the spreadsheet:** In [Google Drive](https://drive.google.com), create a new Google Sheet (blank). Name it e.g. "MGSULBAR Data".
2. **Get service account email:** From your `GOOGLE_SHEETS_CREDENTIALS` JSON (in `server/.env`), find the `client_email` field (e.g. `something@project-id.iam.gserviceaccount.com`).
3. **Share the sheet:** Open the spreadsheet → Share → add that `client_email` as **Editor**. Save.
4. **Copy spreadsheet ID:** From the sheet URL `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`, copy the `<SPREADSHEET_ID>` part.
5. **Set env:** In `server/.env`, set `SPREADSHEET_ID=<SPREADSHEET_ID>` and ensure `GOOGLE_SHEETS_CREDENTIALS` is the full JSON string of your service account credentials.
6. **Create tabs:** After logging in, the app calls GET /api/setup once automatically (or call it manually with an authenticated request). The server will create the "Users" and "Letters" tabs with the correct header row if they do not exist.

**Verification:** Open the spreadsheet in Drive; you should see tabs "Users" and "Letters" with headers (id, name, email, …). Backend requests like GET /api/users and GET /api/letters should succeed when authenticated.

---

### Problem: Users or Letters sheet missing or wrong headers

**Symptoms:** Backend errors when reading/writing Users or Letters; empty or malformed data.

**Cause:** Google Sheet was created manually without the expected tabs or headers; or first run did not call `ensureSheets`.

**Fix:** Backend `ensureSheets()` creates missing tabs (Users, Letters) and writes header rows. Ensure SPREADSHEET_ID and GOOGLE_SHEETS_CREDENTIALS are correct; restart server so that first request triggers ensureSheets. If sheet already existed with wrong headers, add missing columns (e.g. passwordHash for Users) or create a new sheet and update SPREADSHEET_ID.

**Verification:** Open the spreadsheet; tabs "Users" and "Letters" exist; first row has expected headers (see [erd.md](erd.md) or server/sheets.js).

---

### Problem: Registration fails with "Email already registered"

**Symptoms:** User submits register form with email that should be new; receives 409 or "Email already registered".

**Cause:** Email already exists in Users sheet (case-insensitive match).

**Fix:** Use a different email or remove the existing row from Users sheet for testing. No code change required.

**Verification:** Register with new email succeeds; user row appears in Users sheet.

---

### Problem: Frontend build fails with EISDIR on index.html

**Symptoms:** `npm run build` (frontend) fails with error like "EISDIR: illegal operation on a directory, read" for index.html.

**Cause:** Environment or tooling issue: something (e.g. path or Vite config) treats index.html as a directory. Not caused by application logic.

**Fix:** Ensure project root has a file `index.html` (not a directory); check vite.config.js for correct `root` and entry; run build from project root; clear node_modules and reinstall if needed.

**Verification:** `npm run build` completes and produces `dist/`.

---

## 3. Environment and deployment

### Problem: CORS errors when frontend calls backend

**Symptoms:** Browser console shows CORS error when frontend (e.g. localhost:8080) calls backend (e.g. localhost:3001).

**Cause:** Backend FRONTEND_URL (or allowed origins) does not include the frontend origin.

**Fix:** In `server/.env`, set FRONTEND_URL to the frontend origin (e.g. `http://localhost:8080`). For multiple origins, use comma-separated list if supported by backend CORS config.

**Verification:** From frontend origin, GET /api/health and POST /api/login succeed without CORS errors.

---

### Problem: Google Sheets API errors (403, 404, quota)

**Symptoms:** Backend logs or responses indicate Google Sheets API errors.

**Cause:** Service account not shared on the spreadsheet (403); wrong SPREADSHEET_ID (404); quota exceeded (429 or similar).

**Fix:** Share the Google Sheet with the service account email (from GOOGLE_SHEETS_CREDENTIALS.client_email) with Editor access. Verify SPREADSHEET_ID matches the spreadsheet URL. For quota, reduce request frequency or request quota increase.

**Verification:** Backend can read/write the spreadsheet; GET /api/letters and GET /api/users return data when sheet has rows.

---

### Deployment without login (bypass)

**Purpose:** Deploy the app so users see the Dashboard and all pages without logging in. Useful for demos or until you add users and enable login.

**Env variables:**

| Variable | Where | Effect |
|----------|--------|--------|
| `VITE_BYPASS_LOGIN=true` | Frontend (build-time, e.g. root `.env` or deployment env) | App starts with a "Guest" user; no redirect to /login. |
| `BYPASS_AUTH=true` | Backend (runtime, e.g. `server/.env`) | API accepts requests with no or invalid token; sets a guest user so /api/letters, /api/dashboard/stats, etc. succeed. |

**To deploy without login:** Set `VITE_BYPASS_LOGIN=true` for the frontend build and `BYPASS_AUTH=true` for the backend. Rebuild the frontend and start the backend with the new env.

**To require login again:** Set both to `false` (or remove them). Rebuild the frontend and restart the backend. Add users via Register or your admin flow; the login page will be required for protected routes.

**Verification:** With bypass on, opening the app shows the dashboard immediately; /login and /register remain reachable. With bypass off, visiting / or any protected route redirects to /login.

**Google Sheet tabs when using bypass:** The app calls GET /api/setup once when it loads with bypass on, so the **Users**, **Letters**, and **Templates** tabs are created in your spreadsheet on first load. Ensure `SPREADSHEET_ID` and `GOOGLE_SHEETS_CREDENTIALS` are set in `server/.env` and the spreadsheet is shared with the service account email (Editor). If tabs still do not appear, call GET /api/setup manually (e.g. `curl.exe -X GET http://localhost:3001/api/setup` when `BYPASS_AUTH=true`; no token needed).

---

## 4. How to update this guide

- **When a new issue is found:** Add a section (Problem / Symptoms / Cause / Fix / Verification).
- **When a fix is applied in code or config:** Update the corresponding entry so the guide stays accurate.
- **Link from QA:** In [qa-testing-guide.md](qa-testing-guide.md), reference this guide for known issues (e.g. "See troubleshooting-guide.md §X").
