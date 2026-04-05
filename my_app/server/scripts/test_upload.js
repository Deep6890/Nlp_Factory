#!/usr/bin/env node
/**
 * scripts/test_upload.js
 * ─────────────────────────────────────────────────────────────────────────────
 * End-to-end test: hits the live server's POST /api/recordings/upload endpoint
 * and verifies the transcript is stored in the response.
 *
 * Prerequisites:
 *   1. Server is running: node server.js
 *   2. .env is configured with valid MONGO_URI, Cloudinary keys, JWT_SECRET
 *   3. You have a valid JWT token (from your /api/auth/login endpoint)
 *
 * Usage:
 *   node scripts/test_upload.js <audio-file> <jwt-token> [server-url]
 *
 * Example:
 *   node scripts/test_upload.js test.webm eyJhbGc... http://localhost:5000
 */

const fs   = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// ── Args ──────────────────────────────────────────────────────────────────
const audioFile  = process.argv[2];
const jwtToken   = process.argv[3];
const serverUrl  = process.argv[4] || 'http://localhost:5000';

if (!audioFile || !jwtToken) {
  console.error('Usage: node scripts/test_upload.js <audio-file> <jwt-token> [server-url]');
  process.exit(1);
}

const absAudio = path.resolve(audioFile);
if (!fs.existsSync(absAudio)) {
  console.error(`Audio file not found: ${absAudio}`);
  process.exit(1);
}

console.log('\n🔍  Armor.ai — Upload + Transcription End-to-End Test');
console.log('──────────────────────────────────────────────────────');
console.log(`   Server  : ${serverUrl}`);
console.log(`   File    : ${absAudio}`);
console.log(`   Token   : ${jwtToken.slice(0, 20)}...`);
console.log('');

// ── Build multipart/form-data manually (no fetch/axios needed) ─────────────
const BOUNDARY = `--------Boundary${Date.now()}`;
const filename  = path.basename(absAudio);
const fileBytes = fs.readFileSync(absAudio);

const partHeader = Buffer.from(
  `--${BOUNDARY}\r\n` +
  `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
  `Content-Type: audio/webm\r\n\r\n`
);

const partMeta = Buffer.from(
  `\r\n--${BOUNDARY}\r\n` +
  `Content-Disposition: form-data; name="mode"\r\n\r\nadaptive` +
  `\r\n--${BOUNDARY}\r\n` +
  `Content-Disposition: form-data; name="lang"\r\n\r\nhi` +
  `\r\n--${BOUNDARY}\r\n` +
  `Content-Disposition: form-data; name="model"\r\n\r\nindicwhisper` +
  `\r\n--${BOUNDARY}--\r\n`
);

const body = Buffer.concat([partHeader, fileBytes, partMeta]);

const url     = new URL('/api/recordings/upload', serverUrl);
const isHttps = url.protocol === 'https:';
const lib     = isHttps ? https : http;

const options = {
  hostname: url.hostname,
  port:     url.port || (isHttps ? 443 : 80),
  path:     url.pathname,
  method:   'POST',
  headers:  {
    'Authorization':  `Bearer ${jwtToken}`,
    'Content-Type':   `multipart/form-data; boundary=${BOUNDARY}`,
    'Content-Length': body.length,
  },
};

console.log('⏳  Sending request (this may take a while — Python is running)...\n');
const startTime = Date.now();

const req = lib.request(options, (response) => {
  let data = '';
  response.on('data', (chunk) => { data += chunk; });
  response.on('end', () => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`── Response received (${elapsed}s) ──`);
    console.log(`   HTTP Status : ${response.statusCode}`);

    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (_) {
      console.error('❌  Response is not valid JSON:');
      console.error(data.slice(0, 500));
      process.exit(1);
    }

    console.log('\n   Full response:');
    console.log(JSON.stringify(parsed, null, 2));

    // ── Checks ──────────────────────────────────────────────────────────
    if (response.statusCode !== 201 && response.statusCode !== 200) {
      console.error(`\n❌  FAIL: Expected 2xx, got ${response.statusCode}`);
      process.exit(1);
    }

    if (!parsed.transcript || typeof parsed.transcript !== 'string' || parsed.transcript.trim() === '') {
      console.error('\n❌  FAIL: transcript field is missing or empty in response');
      console.error('   This means the controller did not save the transcript correctly.');
      process.exit(1);
    }

    if (parsed.status !== 'completed') {
      console.error(`\n❌  FAIL: status is "${parsed.status}" instead of "completed"`);
      process.exit(1);
    }

    console.log('\n✅  END-TO-END TEST PASSED');
    console.log('──────────────────────────────────────────────────────');
    console.log(`   Doc id     : ${parsed.id}`);
    console.log(`   Status     : ${parsed.status}`);
    console.log(`   Transcript : "${(parsed.transcript || '').slice(0, 120)}"`);
    console.log('\n✔  Transcript IS stored in MongoDB. Pipeline is working!\n');
  });
});

req.on('error', (err) => {
  console.error(`\n❌  Request failed: ${err.message}`);
  console.error('   Is the server running? Try: node server.js');
  process.exit(1);
});

req.write(body);
req.end();
