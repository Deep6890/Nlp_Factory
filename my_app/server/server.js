require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const mongoose     = require('mongoose');
const rateLimit    = require('express-rate-limit');
const os           = require('os');
const path         = require('path');
const fs           = require('fs');

const app  = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// ── Ensure tmp dir ────────────────────────────────────────────────────────────
const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// ── Rate limiters ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS  || '900000'),
  max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max:      parseInt(process.env.AUTH_RATE_LIMIT_MAX  || '20'),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many auth attempts, please try again later.' },
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin:         process.env.CORS_ORIGIN || '*',
  methods:        ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(globalLimiter);

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _, next) => { console.log(`[HTTP] ${req.method} ${req.path}`); next(); });
}

// ── Root ─────────────────────────────────────────────────────────────────────
app.get('/', (_, res) => res.json({
  name:    'Armor.ai Backend',
  version: '2.0.0',
  status:  'running',
  db:      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  endpoints: [
    'GET  /health',
    'POST /api/auth/register',
    'POST /api/auth/login',
    'GET  /api/auth/me',
    'POST /api/recordings/upload',
    'GET  /api/recordings',
    'GET  /api/recordings/:id',
    'DELETE /api/recordings/:id',
    'POST /api/recordings/:id/retry',
  ],
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',       authLimiter, require('./routes/auth'));
app.use('/api/recordings', require('./routes/recordings'));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({
  ok:     true,
  server: 'armor-backend',
  time:   new Date().toISOString(),
  db:     mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
}));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Not found: ${req.method} ${req.path}` }));

// ── Error handler ─────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  try {
    console.log('\nArmor.ai Backend');
    console.log('─────────────────────────────');
    console.log('Connecting to MongoDB...');

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS:          45_000,
    });
    console.log(`✔ MongoDB connected (${mongoose.connection.db.databaseName})`);

    const server = app.listen(PORT, '0.0.0.0', () => {
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`✘ Port ${PORT} is already in use. Run: netstat -ano | findstr :${PORT}  then  taskkill /PID <pid> /F`);
          process.exit(1);
        }
      });
      console.log(`✔ Server running on port ${PORT}`);
      const nets = os.networkInterfaces();
      for (const iface of Object.values(nets).flat()) {
        if (iface.family === 'IPv4' && !iface.internal)
          console.log(`   → http://${iface.address}:${PORT}`);
      }
      console.log('─────────────────────────────\n');
    });

    const shutdown = async (sig) => {
      console.log(`\n[${sig}] Shutting down...`);
      server.close(async () => { await mongoose.disconnect(); process.exit(0); });
    };
    process.on('SIGINT',  () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (err) {
    console.error('✘ Failed to start:', err.message);
    process.exit(1);
  }
}

start();
