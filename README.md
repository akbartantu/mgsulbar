# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Backend and Google Sheets

The app uses a Node.js backend in `server/` that reads/writes data via the Google Sheets API.

1. **Backend (local)**  
   From the project root:
   ```sh
   cd server
   cp .env.example .env
   # Edit .env: add GOOGLE_SHEETS_CREDENTIALS (Service Account JSON), SPREADSHEET_ID, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FRONTEND_URL
   npm install
   npm start
   ```
   Backend runs at `http://localhost:3001` by default.

2. **Frontend (local)**  
   From the project root:
   ```sh
   cp .env.example .env
   # Edit .env: set VITE_API_URL=http://localhost:3001 and VITE_GOOGLE_CLIENT_ID (same as backend)
   npm run dev
   ```

3. **Setup Google Sheet**
   - Create a new Google Sheet in Google Drive.
   - Share the sheet with the **Service Account** email (from `service-account.json` → `client_email`, e.g. `...@....iam.gserviceaccount.com`) with **Editor** access.
   - Copy the spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`.
   - Set `SPREADSHEET_ID` in `server/.env`.
   - The first time the app runs (e.g. when a user registers or when you load users/letters), the **Users** and **Letters** tabs will be created automatically with the correct headers. You do not need to create them manually.

4. **Auth and registration**
   - Sign in uses Google (OAuth). Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the backend `.env`, and `VITE_GOOGLE_CLIENT_ID` in the frontend `.env` (same OAuth client ID).
   - Users must **register first** (Daftar dengan Google). Their data (name, email, role, department) is stored in the **Users** sheet. Only registered users can log in; if someone signs in with Google but is not in the sheet, they are redirected to the register page.

## CI/CD (GitHub Actions)

On push or pull request to `main`/`master`, the workflow in `.github/workflows/ci.yml` runs:

- **Frontend**: `npm ci`, `npm run lint`, `npm run build`
- **Backend**: `npm ci` and a short start check in `server/`

## Deploy on Render

- **Backend**: Create a **Web Service**, connect this repo, set root directory to `server`, build command `npm install`, start command `npm start`. Add env vars: `GOOGLE_SHEETS_CREDENTIALS`, `SPREADSHEET_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL` (your Render frontend URL).

- **Frontend**: Create a **Static Site**, connect this repo, build command `npm install && npm run build`, publish directory `dist`. Add env var `VITE_API_URL` = your backend URL (e.g. `https://your-backend.onrender.com`) and `VITE_GOOGLE_CLIENT_ID`. Rebuild after changing env.

- **CORS**: Backend allows origins from `FRONTEND_URL` and `http://localhost:8080`.

## How can I deploy this project?

You can deploy the frontend and backend on [Render](https://render.com) as above, or use Lovable Share -> Publish for the frontend only (backend must be hosted separately).

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
