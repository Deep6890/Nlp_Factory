/**
 * server.js  —  Armor.ai Backend Entry Point (replaces old index.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles:
 *  • MongoDB connection via Mongoose
 *  • Express app setup
 *  • Route registration
 *  • Graceful shutdown
 *
 * Usage:
 *   node server.js          (production)
 *   nodemon server.js       (dev with auto-reload)
 */

require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const mongoose  = require('mongoose');
const os        = require('os');
const path      = require('path');
const fs        = require('fs');

const app  = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// ── Ensure tmp directory exists ───────────────────────────────────────────
const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // tighten this in production
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Request logger (dev only) ──────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _, next) => {
    console.log(`[HTTP] ${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/recordings', require('./routes/recordings'));
// Uncomment when you add auth routes:
// app.use('/api/auth',       require('./routes/auth'));

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (_, res) => {
  res.json({
    ok:     true,
    server: 'armor-backend',
    time:   new Date().toISOString(),
    db:     mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ── 404 fallthrough ────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── Global error handler ───────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[UNHANDLED]', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ── MongoDB + Start ─────────────────────────────────────────────────────────
async function startServer() {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    console.error('✘ MONGO_URI is not set in .env — cannot start server');
    process.exit(1);
  }

  try {
    console.log('\nArmor.ai Backend');
    console.log('─────────────────────────────');
    console.log('Connecting to MongoDB...');

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10_000, // fail fast if no DB
      socketTimeoutMS:          45_000,
    });

    const dbName = mongoose.connection.db.databaseName;
    console.log(`✔ MongoDB connected (db: ${dbName})`);

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✔ Server running on port ${PORT}`);

      // Print all local IPs
      const nets = os.networkInterfaces();
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            console.log(`   → http://${net.address}:${PORT}`);
          }
        }
      }
      console.log('─────────────────────────────\n');
    });

    // ── Graceful shutdown ───────────────────────────────────────────────
    const shutdown = async (signal) => {
      console.log(`\n[${signal}] Shutting down gracefully...`);
      server.close(async () => {
        await mongoose.disconnect();
        console.log('✔ MongoDB disconnected. Bye.');
        process.exit(0);
      });
    };
    process.on('SIGINT',  () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (err) {
    console.error('✘ Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
