// server/index.js
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import fs from 'fs';
import http from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { WebSocketServer } from 'ws';
import { runSeed } from './seed/seeder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

// Load environment variables from sally_ui/.env explicitly
dotenv.config({ path: path.join(root, '.env') });

const PORT = process.env.PORT || 5173;
const API_BASE = process.env.API_BASE || 'http://localhost:18080/api';
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(root, 'uploads');
const DEV_MODE_OAUTH = String(process.env.DEV_MODE_OAUTH || 'true') === 'true';
const ADMIN_SEED_SECRET = process.env.ADMIN_SEED_SECRET || '';
const SEED_FILE = process.env.SEED_FILE || path.join(__dirname, 'seed', 'seed.json');
console.log('[sally-ui] Env:', {
  PORT,
  API_BASE,
  UPLOAD_DIR,
  DEV_MODE_OAUTH,
  ADMIN_SEED_SECRET: ADMIN_SEED_SECRET ? '<set>' : '<not set>',
  SEED_FILE,
});

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
const server = http.createServer(app);

// --- API proxy comes first (before body parsers) ---
app.use(
  '/api',
  createProxyMiddleware({
    target: API_BASE,
    changeOrigin: true,
    xfwd: true,
    onError(err, req, res) {
      console.error('API proxy error:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Bad gateway' });
      }
    },
  })
);

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Serve logo from repo root (one directory above sally_ui)
app.get('/logo/sally.jpg', (req, res) => res.sendFile(path.resolve(root, '..', 'sally.jpg')));

// OAuth endpoints
app.post('/oauth/google', async (req, res) => {
  try {
    const { idToken, email, name } = req.body || {};
    if (!DEV_MODE_OAUTH) {
      // verify token in production
    }
    const r = await fetch(`${API_BASE}/sally_oauthLogin`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        provider: 'google',
        external_id: idToken || email || name,
        email,
        display_name: name,
      }),
    });
    const j = await r.json();
    return res.json(j);
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post('/oauth/facebook', async (req, res) => {
  try {
    const { accessToken, email, name } = req.body || {};
    if (!DEV_MODE_OAUTH) {
      // verify token in production
    }
    const r = await fetch(`${API_BASE}/sally_oauthLogin`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        provider: 'facebook',
        external_id: accessToken || email || name,
        email,
        display_name: name,
      }),
    });
    const j = await r.json();
    return res.json(j);
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Admin: Seed data into Sally via API calls
// POST /admin/seed { secret?: string, file?: string, api?: string }
// Requires ADMIN_SEED_SECRET if set. Reads seed JSON from file (default: SEED_FILE)
app.post('/admin/seed', async (req, res) => {
  try {
    if (ADMIN_SEED_SECRET && req.body?.secret !== ADMIN_SEED_SECRET) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const seedFile = req.body?.file || SEED_FILE;
    const api = req.body?.api || API_BASE;
    const uiBase = `http://localhost:${PORT}`;
    const summary = await runSeed({ apiBase: api, seedFile, uiBase });
    res.json({ ok: true, summary });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

app.post('/upload', upload.array('files'), (req, res) => {
  const files = (req.files || []).map((f) => ({
    url: '/uploads/' + path.basename(f.path),
    kind: 'file',
    mime: f.mimetype,
    size: f.size,
  }));
  res.json(files);
});

app.use('/uploads', express.static(UPLOAD_DIR));

// Serve React build from client/dist
const clientDist = path.join(root, 'client', 'dist');

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { index: false }));

  app.get('*', (req, res) => {
    const url = req.originalUrl || req.url || '/';

    // exclude API/WS/upload routes
    if (
      url.startsWith('/api') ||
      url.startsWith('/oauth') ||
      url.startsWith('/upload') ||
      url.startsWith('/uploads') ||
      url.startsWith('/ws')
    ) {
      return res.status(404).end();
    }

    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  console.warn(
    '[sally-ui] No client/dist found. Did you run `npm run build` in client/?'
  );
}

// WebSocket for chat/feed notifications
const wss = new WebSocketServer({ server, path: '/ws' });
const sockets = new Set();

wss.on('connection', (ws) => {
  sockets.add(ws);
  ws.on('message', (msg) => {
    for (const s of sockets) {
      if (s !== ws && s.readyState === s.OPEN) {
        try {
          s.send(msg);
        } catch {}
      }
    }
  });
  ws.on('close', () => sockets.delete(ws));
});

server.listen(PORT, () => {
  console.log(`[sally-ui] listening on http://localhost:${PORT}`);
});
