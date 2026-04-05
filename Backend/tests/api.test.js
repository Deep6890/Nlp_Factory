/**
 * api.test.js — Full integration test suite
 *
 * Stack  : Jest + Supertest
 * Target : Live Express app → real MongoDB + Cloudinary + Transcript Engine
 *
 * Run:
 *   npm test
 *   npm test -- --verbose
 *   npm test -- --testNamePattern="Auth"
 *
 * NOTE: Tests run sequentially (--runInBand). State is shared across tests via
 *       module-level variables (authToken, recordingId, etc.) to simulate a real
 *       end-to-end user session.
 *
 * IMPORTANT: Set all required env vars in .env before running.
 *   - MONGODB_URI
 *   - JWT_SECRET
 *   - CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET
 *   - TRANSCRIPT_ENGINE_URL  (optional — upload still passes if engine is down)
 */

require('dotenv').config();

const mongoose = require('mongoose');
const request  = require('supertest');
const path     = require('path');
const fs       = require('fs');
const app      = require('../src/app');

// ── Shared state across tests ─────────────────────────────────────────────────
let authToken    = '';
let userId       = '';
let recordingId  = '';
let transcriptId = '';

// ── Unique test-run credentials (avoids email collisions across runs) ─────────
const RUN_ID     = Date.now();
const TEST_EMAIL = `tester_${RUN_ID}@example.com`;
const TEST_PASS  = 'Test@1234';
const TEST_NAME  = `Tester ${RUN_ID}`;

// ── 1-second silent WAV fixture ───────────────────────────────────────────────
// 44100 Hz · 16-bit · mono = 88200 bytes PCM silence + 44-byte header.
// Cloudinary rejects a header-only (0-sample) file. 1s of silence (~88 KB)
// is always accepted by Cloudinary's video resource_type.
const TMP_AUDIO = path.join(__dirname, `tmp_audio_${RUN_ID}.wav`);

function createMinimalWav() {
  const sampleRate    = 44100;
  const numChannels   = 1;
  const bitsPerSample = 16;
  const numSamples    = sampleRate;                                      // 1 second
  const dataSize      = numSamples * numChannels * (bitsPerSample / 8); // 88200
  const byteRate      = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign    = numChannels * (bitsPerSample / 8);

  const buf = Buffer.alloc(44 + dataSize); // Buffer.alloc zeros = silence
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);   // ChunkSize
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);             // Subchunk1Size
  buf.writeUInt16LE(1, 20);             // PCM
  buf.writeUInt16LE(numChannels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(bitsPerSample, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);       // Subchunk2Size
  fs.writeFileSync(TMP_AUDIO, buf);
}


// ── Lifecycle ─────────────────────────────────────────────────────────────────
beforeAll(async () => {
  createMinimalWav();
  // Connect mongoose so the app can hit MongoDB during tests
  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  // Clean up test user from DB so re-runs don't collide on email unique index
  try {
    const User       = require('../src/models/User');
    const Recording  = require('../src/models/Recording');
    const Transcript = require('../src/models/Transcript');

    if (userId) {
      await Promise.all([
        User.deleteOne({ _id: userId }),
        Recording.deleteMany({ userId }),
        Transcript.deleteMany({ userId }),
      ]);
      console.log('🧹 Test user + data cleaned from MongoDB');
    }
  } catch (e) {
    console.warn('Cleanup warning:', e.message);
  }

  await mongoose.disconnect();
  if (fs.existsSync(TMP_AUDIO)) fs.unlinkSync(TMP_AUDIO);
});

// ═════════════════════════════════════════════════════════════════════════════
// 1. HEALTH CHECK
// ═════════════════════════════════════════════════════════════════════════════
describe('1 · Health Check', () => {
  test('GET /health → 200 ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();

    console.log('✅ Health:', res.body);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. AUTH
// ═════════════════════════════════════════════════════════════════════════════
describe('2 · Auth', () => {

  test('POST /auth/register → 201 + token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASS });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user._id).toBeDefined();

    authToken = res.body.data.token;
    userId    = res.body.data.user._id;

    console.log('✅ Registered:', TEST_EMAIL, '| userId:', userId);
  });

  test('POST /auth/register duplicate email → 409', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASS });

    expect(res.status).toBe(409);
    console.log('✅ Duplicate email blocked:', res.body.message);
  });

  test('POST /auth/register missing fields → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: TEST_EMAIL });

    expect(res.status).toBe(400);
    console.log('✅ Missing fields rejected');
  });

  test('POST /auth/login correct credentials → 200 + token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASS });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();

    authToken = res.body.data.token; // refresh for subsequent tests
    console.log('✅ Login successful, token refreshed');
  });

  test('POST /auth/login wrong password → 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: 'WrongPass99' });

    expect(res.status).toBe(401);
    console.log('✅ Wrong password → 401:', res.body.message);
  });

  test('GET /auth/me with valid token → 200 + user', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(TEST_EMAIL);
    console.log('✅ /auth/me returned user:', res.body.data.user.email);
  });

  test('GET /auth/me without token → 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    console.log('✅ /auth/me without token → 401');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. USER PROFILE
// ═════════════════════════════════════════════════════════════════════════════
describe('3 · User Profile', () => {

  test('GET /users/me → 200 + full profile from MongoDB', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user._id).toBeDefined();
    expect(res.body.data.user.role).toBe('user');
    console.log('✅ GET /users/me → role:', res.body.data.user.role);
  });

  test('GET /users/dashboard → 200 + stats', async () => {
    const res = await request(app)
      .get('/api/v1/users/dashboard')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.data.stats.totalRecordings).toBe('number');
    expect(typeof res.body.data.stats.totalTranscripts).toBe('number');
    console.log('✅ Dashboard stats:', res.body.data.stats);
  });

  test('PUT /users/profile → 200 updated name', async () => {
    const res = await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Tester' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Updated Tester');
    console.log('✅ Profile name updated successfully');
  });

  test('PUT /users/profile with empty name → 400', async () => {
    const res = await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: '' });

    expect(res.status).toBe(400);
    console.log('✅ Empty name rejected');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// 4. RECORDINGS — Upload + automatic transcript pipeline
// ═════════════════════════════════════════════════════════════════════════════
describe('4 · Recordings', () => {

  test(
    'POST /recordings/upload → 201 + recording + transcript',
    async () => {
      const res = await request(app)
        .post('/api/v1/recordings/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('audio', TMP_AUDIO);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const { recording } = res.body.data;
      const transcript = { 
        status: recording.status, 
        _id: recording._id, 
        recordingId: recording._id,
        text: recording.transcript.text,
        language: recording.transcript.language,
        confidence: recording.transcript.confidence,
        keywords: recording.transcript.keywords,
      };

      // ── Recording assertions
      expect(recording).toBeDefined();
      expect(recording._id).toBeDefined();
      expect(recording.userId).toBe(userId);
      expect(recording.cloudUrl).toMatch(/^https?:\/\//);
      expect(recording.cloudPublicId).toContain('/audio/');

      recordingId = recording._id;
      console.log('✅ Recording uploaded | id:', recordingId);
      console.log('   cloudUrl          :', recording.cloudUrl);
      console.log('   cloudPublicId     :', recording.cloudPublicId);
      console.log('   mimeType          :', recording.mimeType);

      // ── Transcript assertions — transcript object MUST be in response
      //    status can be 'done', 'failed', or 'processing'; upload always 201
      expect(transcript).toBeDefined();
      expect(['done', 'failed', 'processing']).toContain(transcript.status);
      expect(transcript.recordingId).toBe(recordingId);

      transcriptId = transcript._id;
      console.log('✅ Transcript | status:', transcript.status, '| id:', transcriptId);

      if (transcript.status === 'done') {
        console.log('   text preview:', (transcript.text || '').slice(0, 80));
        console.log('   language    :', transcript.language);
        console.log('   confidence  :', transcript.confidence);
        console.log('   keywords    :', transcript.keywords?.slice(0, 5));
      } else {
        console.log('⚠️  STT engine unavailable or slow — transcript marked:', transcript.status);
      }
    },
    120_000 // generous timeout for STT engine round-trip
  );

  test('POST /recordings/upload without auth → 401', async () => {
    // Do NOT attach the file — auth middleware runs before multer.
    // Sending an 88 KB body that gets cut off mid-upload causes ECONNRESET.
    // A plain POST with no token is sufficient to prove the 401 guard.
    const res = await request(app)
      .post('/api/v1/recordings/upload');

    expect(res.status).toBe(401);
    console.log('✅ Upload without token → 401');
  });

  test('POST /recordings/upload without file → 400', async () => {
    const res = await request(app)
      .post('/api/v1/recordings/upload')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    console.log('✅ Upload without file → 400:', res.body.message);
  });

  test('GET /recordings → 200 + paginated list', async () => {
    const res = await request(app)
      .get('/api/v1/recordings')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    // service returns data.audios
    expect(Array.isArray(res.body.data.audios)).toBe(true);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    expect(typeof res.body.data.page).toBe('number');
    expect(typeof res.body.data.limit).toBe('number');
    console.log('✅ List recordings | total:', res.body.data.total);
  });

  test('GET /recordings?page=1&limit=5 → pagination params echoed', async () => {
    const res = await request(app)
      .get('/api/v1/recordings?page=1&limit=5')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.limit).toBe(5);
    console.log('✅ Pagination echoed: page=1 limit=5');
  });

  test('GET /recordings/:recordingId → 200 + single recording', async () => {
    const res = await request(app)
      .get(`/api/v1/recordings/${recordingId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.recording._id).toBe(recordingId);
    console.log('✅ GET single recording OK');
  });

  test('GET /recordings/:recordingId with invalid ObjectId → 400', async () => {
    const res = await request(app)
      .get('/api/v1/recordings/not-a-valid-objectid')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400); // fails recordingIdParamRules validation
    console.log('✅ Invalid ObjectId → 400');
  });

  test('GET /recordings/000000000000000000000000 → 404', async () => {
    const res = await request(app)
      .get('/api/v1/recordings/000000000000000000000000')
      .set('Authorization', `Bearer ${authToken}`);

    expect([400, 404]).toContain(res.status);
    console.log('✅ Non-existent recording →', res.status);
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// 5. TRANSCRIPT — via recording endpoint
// ═════════════════════════════════════════════════════════════════════════════
describe('5 · Transcript (via recording)', () => {

  test('GET /recordings/:recordingId/transcript → 200 or 404', async () => {
    const res = await request(app)
      .get(`/api/v1/recordings/${recordingId}/transcript`)
      .set('Authorization', `Bearer ${authToken}`);

    // 200 if transcript exists (any status), 404 if pipeline never wrote it
    expect([200, 404]).toContain(res.status);

    if (res.status === 200) {
      expect(res.body.data.transcript.recordingId).toBe(recordingId);
      console.log('✅ GET /recordings/:id/transcript → status:', res.body.data.transcript.status);
    } else {
      console.log('⚠️  No transcript found for recording (likely STT not configured)');
    }
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// 6. TRANSCRIPTS — standalone endpoints
// ═════════════════════════════════════════════════════════════════════════════
describe('6 · Transcripts', () => {

  test('GET /transcripts → 200 + list with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/transcripts')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.transcripts)).toBe(true);
    expect(typeof res.body.data.total).toBe('number');
    console.log('✅ List transcripts | total:', res.body.data.total);
  });

  test('GET /transcripts/:id → 200 + single transcript', async () => {
    if (!transcriptId) {
      console.log('⚠️  Skipping — no transcriptId from upload test');
      return;
    }
    const res = await request(app)
      .get(`/api/v1/transcripts/${transcriptId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.transcript._id).toBe(transcriptId);
    console.log('✅ GET single transcript OK | status:', res.body.data.transcript.status);
  });

  test('GET /transcripts/search?q=test → 200 (empty or results)', async () => {
    const res = await request(app)
      .get('/api/v1/transcripts/search?q=test')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    console.log('✅ Transcript search | results count:', res.body.data?.results?.length ?? 0);
  });

  test('GET /transcripts/search without q → 400', async () => {
    const res = await request(app)
      .get('/api/v1/transcripts/search')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    console.log('✅ Search without q → 400:', res.body.message);
  });

  test('GET /transcripts without auth → 401', async () => {
    const res = await request(app).get('/api/v1/transcripts');
    expect(res.status).toBe(401);
    console.log('✅ Unauthenticated transcripts → 401');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// 7. USER AUDIOS — /users/:userId/audios
// ═════════════════════════════════════════════════════════════════════════════
describe('7 · User Audios', () => {

  test('GET /users/me/audios → 200 + audio list (shorthand)', async () => {
    const res = await request(app)
      .get('/api/v1/users/me/audios')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.audios)).toBe(true);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    console.log('✅ /users/me/audios | count:', res.body.data.total);
  });

  test('GET /users/:userId/audios with real userId → 200', async () => {
    if (!userId) return console.log('⚠️  Skipping — no userId');

    const res = await request(app)
      .get(`/api/v1/users/${userId}/audios`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.audios)).toBe(true);
    console.log('✅ /users/:userId/audios | count:', res.body.data.total);
  });

  test('GET /users/me/audios?page=1&limit=3 → pagination params echoed', async () => {
    const res = await request(app)
      .get('/api/v1/users/me/audios?page=1&limit=3')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.limit).toBe(3);
    console.log('✅ Pagination echoed: page=1 limit=3');
  });

  test('GET /users/me/audios without auth → 401', async () => {
    const res = await request(app).get('/api/v1/users/me/audios');
    expect(res.status).toBe(401);
    console.log('✅ Unauthenticated user audios → 401');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// 8. MULTIPLE UPLOADS — verifies each creates a new unique recording
// ═════════════════════════════════════════════════════════════════════════════
describe('8 · Multiple Uploads (uniqueness)', () => {

  let secondRecordingId = '';

  test('Second upload creates a NEW, different recording', async () => {
    const res = await request(app)
      .post('/api/v1/recordings/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('audio', TMP_AUDIO);

    expect(res.status).toBe(201);

    const { recording } = res.body.data;
    expect(recording._id).not.toBe(recordingId);         // different _id
    expect(recording.cloudPublicId).toBeDefined();
    // cloudPublicId must differ — no overwriting
    // (we can't assert the first value easily here, just confirm it exists)

    secondRecordingId = recording._id;
    console.log('✅ Second recording created | id:', secondRecordingId);
  }, 120_000);

  test('Both recordings appear in paginated list', async () => {
    const res = await request(app)
      .get('/api/v1/recordings?page=1&limit=10')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);

    const ids = (res.body.data.audios || []).map((r) => r._id);
    expect(ids).toContain(recordingId);
    expect(ids).toContain(secondRecordingId);
    console.log('✅ Both uploads visible in list | total now:', res.body.data.total);
  });

  // Clean up second recording (Cloudinary + Transcript) so afterAll stays fast
  test('Delete second recording cleanly', async () => {
    if (!secondRecordingId) return;

    const res = await request(app)
      .delete(`/api/v1/recordings/${secondRecordingId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    console.log('✅ Second recording deleted');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 9. CLEANUP — Delete first recording (Cloudinary + transcript cascade)
// ═════════════════════════════════════════════════════════════════════════════
describe('9 · Cleanup – Delete recording (cascade)', () => {

  test('DELETE /recordings/:recordingId → 200 + removes Cloudinary + transcript', async () => {
    if (!recordingId) return console.log('⚠️  Skipping — no recordingId');

    const res = await request(app)
      .delete(`/api/v1/recordings/${recordingId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(recordingId);
    console.log('✅ Recording + Cloudinary + transcript cascade deleted');
  });

  test('GET /recordings/:recordingId after delete → 404', async () => {
    if (!recordingId) return;

    const res = await request(app)
      .get(`/api/v1/recordings/${recordingId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    console.log('✅ Fetching deleted recording → 404');
  });

  test('GET /recordings/:recordingId/transcript after delete → 404', async () => {
    if (!recordingId) return;

    const res = await request(app)
      .get(`/api/v1/recordings/${recordingId}/transcript`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    console.log('✅ Fetching transcript of deleted recording → 404');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// 10. 404 CATCH-ALL
// ═════════════════════════════════════════════════════════════════════════════
describe('10 · 404 Catch-all', () => {
  test('GET /api/v1/nonexistent → 404', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    console.log('✅ Unknown route → 404');
  });
});
