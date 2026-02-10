import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import apiRoutes from './routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:8080')
  .split(',')
  .map((u) => u.trim());

app.use(
  cors({
    origin: frontendUrls,
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use('/api', apiRoutes);

// Production: serve frontend static files (Render single-service deploy)
// SPA fallback: any non-API GET request that doesn't match a static file gets index.html
if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    app.use(
      express.static(publicDir, { fallthrough: true })
    );
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(publicDir, 'index.html'), (err) => {
        if (err) next(err);
      });
    });
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
