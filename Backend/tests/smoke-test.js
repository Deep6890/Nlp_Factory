/**
 * ─────────────────────────────────────────────────────────────
 *  smoke-test.js  —  Backend Smoke Test (No external services)
 * ─────────────────────────────────────────────────────────────
 *
 *  PURPOSE:
 *    Quick sanity check that the Express app boots correctly and
 *    all routes are wired up — WITHOUT needing MongoDB, Cloudinary,
 *    or a live JWT secret.
 *
 *  RUN:
 *    node tests/smoke-test.js
 *
 *  What it checks:
 *    ✅  All modules load without import errors
 *    ✅  Every route file attaches without crashing
 *    ✅  Health endpoint responds 200
 *    ✅  401 is returned on protected routes (not 404/500)
 *    ✅  400 is returned for missing required fields
 *    ✅  404 is returned for unknown routes
 *    ✅  Response shape always has { success, message }
 *
 *  NOTE:
 *    This test does NOT touch MongoDB or Cloudinary.
 *    For full integration tests (real DB + upload) → npm test
 * ─────────────────────────────────────────────────────────────
 */

// ── Provide minimal env so modules don't crash on startup ─────────────────────
process.env.JWT_SECRET              = 'smoke-test-secret-at-least-32-chars-long';
process.env.JWT_EXPIRES_IN          = '1h';
process.env.NODE_ENV                = 'test';
process.env.MONGODB_URI             = 'mongodb://localhost:27017/smoke_test_dummy';
process.env.CLOUDINARY_CLOUD_NAME   = 'dummy';
process.env.CLOUDINARY_API_KEY      = 'dummy';
process.env.CLOUDINARY_API_SECRET   = 'dummy';
process.env.TRANSCRIPT_ENGINE_URL   = 'http://localhost:9999/transcribe';

const http = require('http');

// ── Colour helpers ─────────────────────────────────────────────────────────────
const GREEN  = (s) => `\x1b[32m${s}\x1b[0m`;
const RED    = (s) => `\x1b[31m${s}\x1b[0m`;
const YELLOW = (s) => `\x1b[33m${s}\x1b[0m`;
const BOLD   = (s) => `\x1b[1m${s}\x1b[0m`;

let passed = 0;
let failed = 0;
const failures = [];

// ── Assertion helper ──────────────────────────────────────────────────────────
function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ${GREEN('✅')} ${label}`);
    passed++;
  } else {
    console.log(`  ${RED('❌')} ${label}${detail ? `  →  ${RED(detail)}` : ''}`);
    failed++;
    failures.push(label);
  }
}

// ── HTTP helper ───────────────────────────────────────────────────────────────
function httpRequest(options, body = null) {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        let parsed = {};
        try { parsed = JSON.parse(raw); } catch {}
        resolve({ status: res.statusCode, body: parsed, raw });
      });
    });
    req.on('error', (err) => resolve({ status: 0, body: {}, error: err.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Module loading test ───────────────────────────────────────────────────────
function testModuleLoading() {
  console.log(`\n${BOLD('── 1. Module Loading ─────────────────────────────────────')}`);

  const modules = [
    '../src/utils/ApiError',
    '../src/utils/ApiResponse',
    '../src/utils/logger',
    '../src/middlewares/authMiddleware',
    '../src/middlewares/errorMiddleware',
    '../src/middlewares/uploadMiddleware',
    '../src/middlewares/rateLimiter',
    '../src/validations/authValidation',
    '../src/validations/recordingValidation',
    '../src/models/User',
    '../src/models/Recording',
    '../src/models/Transcript',
    '../src/services/authService',
    '../src/services/storageService',
    '../src/services/userService',
    '../src/routes/authRoutes',
    '../src/routes/recordingRoutes',
    '../src/routes/transcriptRoutes',
    '../src/routes/userRoutes',
    '../src/app',
  ];

  for (const mod of modules) {
    try {
      require(mod);
      const shortName = mod.replace('../src/', '');
      assert(`Loaded: ${shortName}`, true);
    } catch (err) {
      const shortName = mod.replace('../src/', '');
      assert(`Loaded: ${shortName}`, false, err.message);
    }
  }
}

// ── Live route tests ──────────────────────────────────────────────────────────
async function testRoutes(port) {
  const BASE = { hostname: 'localhost', port };

  const get  = (path)       => httpRequest({ ...BASE, method: 'GET',    path, headers: { 'Content-Type': 'application/json' } });
  const post = (path, body) => httpRequest({ ...BASE, method: 'POST',   path, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(JSON.stringify(body || {})) } }, body);
  const put  = (path, body) => httpRequest({ ...BASE, method: 'PUT',    path, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(JSON.stringify(body || {})) } }, body);
  const del  = (path)       => httpRequest({ ...BASE, method: 'DELETE', path, headers: { 'Content-Type': 'application/json' } });
  const auth = (token)      => ({ Authorization: `Bearer ${token}` });
  const getAuth  = (path, token) => httpRequest({ ...BASE, method: 'GET',    path, headers: { 'Content-Type': 'application/json', ...auth(token) } });
  const postAuth = (path, body, token) => {
    const b = JSON.stringify(body || {});
    return httpRequest({ ...BASE, method: 'POST', path, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(b), ...auth(token) } }, body);
  };

  // ── Health ──────────────────────────────────────────────────────────────────
  console.log(`\n${BOLD('── 2. Health Check ───────────────────────────────────────')}`);
  {
    const r = await get('/health');
    assert('GET /health → 200',              r.status === 200);
    assert('GET /health → status: ok',       r.body.status === 'ok');
    assert('GET /health → has timestamp',    typeof r.body.timestamp === 'string');
  }

  // ── Auth validation ─────────────────────────────────────────────────────────
  console.log(`\n${BOLD('── 3. Auth Routes ────────────────────────────────────────')}`);
  {
    // Register missing fields → 400
    const r1 = await post('/api/v1/auth/register', {});
    assert('POST /auth/register empty body → 400',      r1.status === 400);
    assert('POST /auth/register → success:false',       r1.body.success === false);

    // Register weak password → 400
    const r2 = await post('/api/v1/auth/register', { name: 'Test', email: 'x@x.com', password: 'weak' });
    assert('POST /auth/register weak password → 400',   r2.status === 400);

    // Login missing fields → 400
    const r3 = await post('/api/v1/auth/login', {});
    assert('POST /auth/login empty body → 400',         r3.status === 400);
    assert('POST /auth/login → success:false',          r3.body.success === false);

    // /auth/me without token → 401
    const r4 = await get('/api/v1/auth/me');
    assert('GET /auth/me no token → 401',               r4.status === 401);
    assert('GET /auth/me → message defined',            typeof r4.body.message === 'string');
  }

  // ── Protected routes (no token) → 401 ──────────────────────────────────────
  console.log(`\n${BOLD('── 4. Auth Guards (no token should → 401) ────────────────')}`);
  {
    const routes = [
      ['GET',    '/api/v1/users/me'],
      ['GET',    '/api/v1/users/dashboard'],
      ['PUT',    '/api/v1/users/profile'],
      ['GET',    '/api/v1/users/me/audios'],
      ['GET',    '/api/v1/recordings'],
      ['GET',    '/api/v1/recordings/000000000000000000000000'],
      ['DELETE', '/api/v1/recordings/000000000000000000000000'],
      ['GET',    '/api/v1/transcripts'],
    ];

    for (const [method, path] of routes) {
      const r = await httpRequest({ ...BASE, method, path, headers: {} });
      assert(`${method} ${path} no token → 401`, r.status === 401, `got ${r.status}`);
    }
  }

  // ── Invalid token → 401 ─────────────────────────────────────────────────────
  console.log(`\n${BOLD('── 5. Invalid Token ──────────────────────────────────────')}`);
  {
    const r = await getAuth('/api/v1/users/me', 'this.is.not.a.valid.jwt');
    assert('GET /users/me invalid token → 401', r.status === 401);
  }

  // ── Validation — recordings ─────────────────────────────────────────────────
  console.log(`\n${BOLD('── 6. Route Validation (bad ObjectId params) ─────────────')}`);
  {
    // Bad ObjectId on a protected route — will hit auth first (no token), returns 401
    // To specifically test ObjectId validation we'd need a real token.
    // Instead just confirm these paths exist (not 404).
    const r1 = await get('/api/v1/recordings/not-an-objectid');
    assert('GET /recordings/bad-id → 401 (auth guard before param check)', r1.status === 401);

    const r2 = await get('/api/v1/recordings/not-an-objectid/transcript');
    assert('GET /recordings/bad-id/transcript → 401',                      r2.status === 401);
  }

  // ── 404 catch-all ───────────────────────────────────────────────────────────
  console.log(`\n${BOLD('── 7. 404 Catch-all ──────────────────────────────────────')}`);
  {
    const r1 = await get('/api/v1/does-not-exist');
    assert('GET /api/v1/does-not-exist → 404',    r1.status === 404);
    assert('404 body → success:false',            r1.body.success === false);

    const r2 = await get('/completely/unknown/path');
    assert('GET /completely/unknown/path → 404',  r2.status === 404);
  }

  // ── Response shape contract ─────────────────────────────────────────────────
  console.log(`\n${BOLD('── 8. Response Shape Contract ────────────────────────────')}`);
  {
    // Every error response must have success:false and a string message
    const tests = [
      await get('/api/v1/auth/me'),
      await post('/api/v1/auth/register', {}),
      await post('/api/v1/auth/login', {}),
      await get('/api/v1/does-not-exist'),
    ];
    for (const r of tests) {
      assert(
        `Response has success:false + message (status ${r.status})`,
        r.body.success === false && typeof r.body.message === 'string',
        JSON.stringify(r.body).slice(0, 80)
      );
    }
  }
}

// ── Main runner ───────────────────────────────────────────────────────────────
async function main() {
  console.log(BOLD('\n╔════════════════════════════════════════════════╗'));
  console.log(BOLD('║      BACKEND SMOKE TEST — audio-transcript     ║'));
  console.log(BOLD('╚════════════════════════════════════════════════╝'));

  // Step 1: test module loading (no server needed)
  testModuleLoading();

  // Step 2: spin up a real HTTP server on a random free port
  console.log(`\n${BOLD('── Starting test server…')}`);
  let app;
  try {
    app = require('../src/app');
  } catch (err) {
    console.error(RED(`\n❌ FATAL: Could not load app.js — ${err.message}`));
    console.error(err.stack);
    process.exit(1);
  }

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(GREEN(`   Server listening on port ${port}`));

  // Step 3: run route tests
  try {
    await testRoutes(port);
  } finally {
    server.close();
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log(`\n${BOLD('╔════════════════════════════════════════════════╗')}`);
  console.log(BOLD(`║                  RESULTS                       ║`));
  console.log(BOLD(`╚════════════════════════════════════════════════╝`));
  console.log(`  Total  : ${BOLD(total)}`);
  console.log(`  Passed : ${GREEN(BOLD(passed))}`);
  console.log(`  Failed : ${failed > 0 ? RED(BOLD(failed)) : GREEN(BOLD(failed))}`);

  if (failures.length) {
    console.log(`\n${RED('Failed checks:')}`);
    failures.forEach((f) => console.log(`  ${RED('•')} ${f}`));
    console.log();
    process.exit(1);
  } else {
    console.log(`\n${GREEN(BOLD('  🎉  All checks passed! Backend is wired correctly.'))} `);
    console.log(YELLOW('  Next: fill in .env and run  npm test  for full integration tests.\n'));
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(RED('\nUnexpected error:'), err);
  process.exit(1);
});
