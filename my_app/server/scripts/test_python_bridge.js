#!/usr/bin/env node
/**
 * scripts/test_python_bridge.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Standalone test for the Python transcription bridge.
 * Run this FIRST to confirm Python works before touching the full server.
 *
 * Usage:
 *   node scripts/test_python_bridge.js <path-to-audio-file> [model] [lang]
 *
 * Examples:
 *   node scripts/test_python_bridge.js test.webm
 *   node scripts/test_python_bridge.js meeting.wav indicwhisper hi
 *   node scripts/test_python_bridge.js audio.m4a indicwav2vec bn
 *
 * What this tests:
 *   ✔ Python is in PATH and executable
 *   ✔ transcribe_bridge.py exists at the expected path
 *   ✔ Python can import audio_utils and models
 *   ✔ stdout is valid JSON
 *   ✔ transcript field is non-empty string
 */

const { spawn } = require('child_process');
const path      = require('path');
const fs        = require('fs');

// ── Config ────────────────────────────────────────────────────────────────
const PYTHON_STT_DIR = path.resolve(__dirname, '../../../AiModule/SpeechToText');
const PYTHON_BRIDGE  = path.join(PYTHON_STT_DIR, 'transcribe_bridge.py');
const PYTHON_BIN     = process.platform === 'win32' ? 'python' : 'python3';

// ── Args ──────────────────────────────────────────────────────────────────
const audioFile = process.argv[2];
const model     = process.argv[3] || 'indicwhisper';
const lang      = process.argv[4] || 'hi';

// ── Checks ────────────────────────────────────────────────────────────────
console.log('\n🔍  Armor.ai — Python Bridge Test');
console.log('──────────────────────────────────');

if (!audioFile) {
  console.error('❌  Usage: node scripts/test_python_bridge.js <audio-file> [model] [lang]');
  process.exit(1);
}

const absAudio = path.resolve(audioFile);
if (!fs.existsSync(absAudio)) {
  console.error(`❌  Audio file not found: ${absAudio}`);
  process.exit(1);
}

if (!fs.existsSync(PYTHON_BRIDGE)) {
  console.error(`❌  Bridge script not found: ${PYTHON_BRIDGE}`);
  console.error('    Make sure transcribe_bridge.py is in AiModule/SpeechToText/');
  process.exit(1);
}

console.log(`✔  Bridge  : ${PYTHON_BRIDGE}`);
console.log(`✔  Audio   : ${absAudio}`);
console.log(`✔  Model   : ${model}`);
console.log(`✔  Lang    : ${lang}`);
console.log(`✔  Python  : ${PYTHON_BIN}`);
console.log('');
console.log('⏳  Spawning Python...\n');

// ── Run ───────────────────────────────────────────────────────────────────
const startTime = Date.now();

const py = spawn(
  PYTHON_BIN,
  [PYTHON_BRIDGE, absAudio, '--model', model, '--lang', lang],
  {
    cwd:   PYTHON_STT_DIR,
    env:   { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  }
);

let stdoutBuf = '';
let stderrBuf = '';

py.stdout.on('data', (d) => { stdoutBuf += d.toString(); });
py.stderr.on('data', (d) => {
  stderrBuf += d.toString();
  process.stderr.write(d); // show Python logs live
});

py.on('close', (code) => {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n── Python exited (code=${code}) after ${elapsed}s ──`);

  if (!stdoutBuf.trim()) {
    console.error('❌  FAIL: Python produced no stdout output');
    console.error('   This means either:');
    console.error('   1. Python crashed before the print(json.dumps(...)) line');
    console.error('   2. All output went to stderr — check logs above');
    process.exit(1);
  }

  let parsed;
  try {
    parsed = JSON.parse(stdoutBuf.trim());
  } catch (e) {
    console.error(`❌  FAIL: stdout is not valid JSON — ${e.message}`);
    console.error(`   Raw stdout: ${stdoutBuf.slice(0, 500)}`);
    process.exit(1);
  }

  if (!parsed.ok) {
    console.error(`❌  FAIL: Python returned ok=false`);
    console.error(`   Error   : ${parsed.error}`);
    console.error(`   Traceback:\n${parsed.traceback}`);
    process.exit(1);
  }

  if (!parsed.transcript || typeof parsed.transcript !== 'string') {
    console.error('❌  FAIL: transcript field is missing or not a string');
    console.error(`   Parsed response: ${JSON.stringify(parsed, null, 2)}`);
    process.exit(1);
  }

  // ── All good ──────────────────────────────────────────────────────────
  console.log('\n✅  ALL CHECKS PASSED');
  console.log('──────────────────────────────────');
  console.log(`   Words       : ${parsed.word_count}`);
  console.log(`   Inference   : ${parsed.duration_ms}ms`);
  console.log(`   Model used  : ${parsed.model}`);
  console.log(`   Language    : ${parsed.lang}`);
  console.log(`\n   Transcript  :\n`);
  console.log(`   "${parsed.transcript}"`);
  console.log('\n✔  Python bridge is working correctly.');
  console.log('   You can now start the Node.js server.\n');
});

py.on('error', (err) => {
  console.error(`❌  FAIL: Could not spawn Python`);
  console.error(`   Error: ${err.message}`);
  console.error(`   Is '${PYTHON_BIN}' in your PATH?`);
  console.error(`   Try running: ${PYTHON_BIN} --version`);
  process.exit(1);
});
