require('dotenv').config();

const express   = require('express');
const helmet    = require('helmet');
const cors      = require('cors');

const { httpLogger }      = require('./utils/logger');
const { apiRateLimiter }  = require('./middlewares/rateLimiter');
const { errorMiddleware } = require('./middlewares/errorMiddleware');

// ── Route modules ─────────────────────────────────────────────────────────────
const authRoutes       = require('./routes/authRoutes');
const recordingRoutes  = require('./routes/recordingRoutes');
const transcriptRoutes = require('./routes/transcriptRoutes');
const userRoutes       = require('./routes/userRoutes');

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(httpLogger);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── General rate limiting ─────────────────────────────────────────────────────
app.use('/api', apiRateLimiter);

// ── Health check (no auth, no rate limit) ─────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── API routes ────────────────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`,        authRoutes);
app.use(`${API}/recordings`,  recordingRoutes);
app.use(`${API}/transcripts`, transcriptRoutes);
app.use(`${API}/users`,       userRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
