const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const os      = require('os');

const app  = express();
const PORT = 3000;
const AUTO_DELETE_MS = 60 * 60 * 1000; // 1 hour

app.use(cors());
app.use(express.json());

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// ── Storage ───────────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOADS_DIR),
  filename:    (_, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const AUDIO_EXTS = ['.m4a', '.webm', '.wav', '.mp3', '.ogg'];
const MIME_MAP   = { '.m4a': 'audio/mp4', '.webm': 'audio/webm', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };

function isAudioFile(f) { return AUDIO_EXTS.some(ext => f.endsWith(ext)); }

function metaPath(filePath) {
  return filePath.replace(/\.(m4a|webm|wav|mp3|ogg)$/, '.json');
}

function readMeta(filename) {
  try {
    const mp = metaPath(path.join(UPLOADS_DIR, filename));
    if (fs.existsSync(mp)) return JSON.parse(fs.readFileSync(mp, 'utf8'));
  } catch (_) {}
  return {};
}

function writeMeta(filePath, data) {
  fs.writeFileSync(metaPath(filePath), JSON.stringify(data, null, 2));
}

function getFiles() {
  return fs.readdirSync(UPLOADS_DIR)
    .filter(f => isAudioFile(f))
    .map(f => {
      const fp   = path.join(UPLOADS_DIR, f);
      const stat = fs.statSync(fp);
      const meta = readMeta(f);
      return {
        id:          path.basename(f, path.extname(f)),
        filename:    f,
        size:        stat.size,
        mode:        meta.mode || 'adaptive',
        recordedAt:  meta.recordedAt || meta.timestamp || stat.mtime.toISOString(),
        durationSec: Number(meta.durationSec || 0),
        uploadedAt:  stat.mtime.toISOString(),
        expiresIn:   Math.max(0, AUTO_DELETE_MS - (Date.now() - stat.mtimeMs)),
        transcript:  meta.transcript || null,
        keywords:    meta.keywords   || [],
        emotions:    meta.emotions   || [],
        url:         `/recordings/${f}`,
      };
    })
    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
}

// ── Auto-delete ───────────────────────────────────────────────────────────────

setInterval(() => {
  const now = Date.now();
  try {
    fs.readdirSync(UPLOADS_DIR).filter(f => isAudioFile(f)).forEach(f => {
      const fp   = path.join(UPLOADS_DIR, f);
      const stat = fs.statSync(fp);
      if (now - stat.mtimeMs > AUTO_DELETE_MS) {
        fs.unlinkSync(fp);
        const mp = metaPath(fp);
        if (fs.existsSync(mp)) fs.unlinkSync(mp);
        console.log(`[AUTO-DELETE] ${f}`);
      }
    });
  } catch (e) { console.error('[AUTO-DELETE ERROR]', e.message); }
}, 5 * 60 * 1000);

// ── Web UI ────────────────────────────────────────────────────────────────────

app.get('/', (_, res) => {
  const files = getFiles();

  const rows = files.map(f => {
    const kb     = (f.size / 1024).toFixed(1);
    const delMin = Math.max(0, Math.floor(f.expiresIn / 60000));
    const recAt  = new Date(f.recordedAt).toLocaleString();
    const dur    = f.durationSec > 0 ? `${f.durationSec}s` : '-';
    const trans  = f.transcript
      ? `<span class="transcript">${f.transcript.slice(0, 80)}${f.transcript.length > 80 ? '…' : ''}</span>`
      : '<span class="no-trans">Not analyzed</span>';

    return `<tr>
      <td><span class="fname">${f.filename}</span></td>
      <td>${recAt}</td>
      <td>${dur}</td>
      <td>${kb} KB</td>
      <td>${trans}</td>
      <td><span class="del-badge">~${delMin}m</span></td>
      <td>
        <a href="/recordings/${f.filename}" target="_blank">▶ Play</a>
        <a href="/recordings/${f.filename}" download>⬇ Save</a>
      </td>
    </tr>`;
  }).join('');

  const totalKb = (files.reduce((s, f) => s + f.size, 0) / 1024).toFixed(0);

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Armor.ai Server</title>
  <meta http-equiv="refresh" content="15">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',sans-serif;background:#FFFDF6;color:#2D2D2D;padding:24px}
    h1{font-size:22px;font-weight:700;color:#3D5A3E}
    h1 span{color:#6B8C2A}
    .sub{color:#888;font-size:13px;margin:4px 0 20px}
    .badge{background:#DDEB9D;color:#3D5A3E;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600}
    .stats{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
    .stat{background:#fff;border-radius:12px;padding:12px 18px;flex:1;min-width:100px;box-shadow:0 1px 6px rgba(0,0,0,.06);border:1px solid #DDEB9D55}
    .stat-n{font-size:26px;font-weight:700;color:#3D5A3E}
    .stat-l{font-size:11px;color:#888;margin-top:2px}
    .card{background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,.07);overflow:hidden;border:1px solid #DDEB9D55}
    table{width:100%;border-collapse:collapse}
    th{background:#3D5A3E;color:#FFFDF6;padding:10px 14px;text-align:left;font-size:12px;font-weight:600}
    td{padding:10px 14px;border-bottom:1px solid #f0f0e8;font-size:12px;vertical-align:middle}
    tr:last-child td{border-bottom:none}
    tr:hover td{background:#f9fdf0}
    .fname{font-family:monospace;font-size:11px;color:#555}
    .del-badge{background:#FFF3CD;color:#856404;padding:2px 7px;border-radius:8px;font-size:11px}
    .transcript{color:#3D5A3E;font-style:italic}
    .no-trans{color:#bbb;font-size:11px}
    a{color:#3D5A3E;text-decoration:none;font-weight:600;margin-right:8px;font-size:12px}
    .empty{text-align:center;padding:40px;color:#AAA;font-size:14px}

    /* Upload panel */
    .upload-panel{background:#fff;border-radius:16px;padding:20px;margin-bottom:20px;border:1px solid #DDEB9D88;box-shadow:0 1px 8px rgba(0,0,0,.05)}
    .upload-panel h2{font-size:15px;color:#3D5A3E;margin-bottom:14px;font-weight:700}
    .drop-zone{border:2px dashed #DDEB9D;border-radius:12px;padding:28px;text-align:center;cursor:pointer;transition:background .2s;background:#FFFDF6}
    .drop-zone:hover,.drop-zone.drag{background:#f0f7e0;border-color:#6B8C2A}
    .drop-zone p{color:#888;font-size:13px;margin-top:8px}
    .drop-zone .icon{font-size:32px}
    .file-info{margin-top:12px;padding:10px 14px;background:#f9fdf0;border-radius:10px;display:none;align-items:center;gap:10px;border:1px solid #DDEB9D55}
    .file-info .fi-name{font-size:13px;font-weight:600;color:#3D5A3E;flex:1}
    .file-info .fi-size{font-size:11px;color:#888}
    .btn{background:#3D5A3E;color:#fff;border:none;padding:10px 22px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:background .2s}
    .btn:hover{background:#4A6010}
    .btn:disabled{background:#ccc;cursor:not-allowed}
    .btn-row{display:flex;gap:10px;margin-top:14px;align-items:center}
    .result-box{margin-top:16px;padding:14px;background:#f0f7e0;border-radius:12px;display:none;border:1px solid #DDEB9D}
    .result-box h3{font-size:13px;color:#3D5A3E;margin-bottom:8px;font-weight:700}
    .result-box .transcript-text{font-size:13px;color:#2D2D2D;line-height:1.6;white-space:pre-wrap}
    .result-box .kw-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
    .kw{background:#DDEB9D;color:#3D5A3E;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
    .error-box{margin-top:12px;padding:10px 14px;background:#fff0f0;border-radius:10px;color:#c0392b;font-size:12px;display:none;border:1px solid #f5c6cb}
    .spinner{display:none;width:18px;height:18px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin .7s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
  </style>
</head>
<body>
  <h1>Armor<span>.ai</span></h1>
  <p class="sub">Adaptive recording server &nbsp;<span class="badge">Live</span>&nbsp; files auto-delete after 1h</p>

  <div class="stats">
    <div class="stat"><div class="stat-n">${files.length}</div><div class="stat-l">Recordings</div></div>
    <div class="stat"><div class="stat-n">${totalKb} KB</div><div class="stat-l">Total size</div></div>
    <div class="stat"><div class="stat-n">1h</div><div class="stat-l">Auto-delete</div></div>
  </div>

  <!-- Upload & Analyze Panel -->
  <div class="upload-panel">
    <h2>🎙 Upload & Analyze Audio</h2>
    <div class="drop-zone" id="dropZone" onclick="document.getElementById('fileInput').click()">
      <div class="icon">🎵</div>
      <strong>Click or drag audio file here</strong>
      <p>Supports .webm, .m4a, .wav, .mp3, .ogg</p>
    </div>
    <input type="file" id="fileInput" accept="audio/*,.webm,.m4a,.wav,.mp3,.ogg" style="display:none">
    <div class="file-info" id="fileInfo">
      <span class="icon">🎵</span>
      <span class="fi-name" id="fiName"></span>
      <span class="fi-size" id="fiSize"></span>
      <button class="btn" style="padding:6px 14px;font-size:12px" onclick="clearFile()">✕</button>
    </div>
    <div class="btn-row">
      <button class="btn" id="uploadBtn" onclick="doUpload()" disabled>
        <span id="uploadBtnText">⬆ Upload</span>
        <span class="spinner" id="uploadSpinner"></span>
      </button>
      <button class="btn" id="analyzeBtn" onclick="doAnalyze()" disabled style="background:#6B8C2A">
        <span id="analyzeBtnText">🔍 Analyze</span>
        <span class="spinner" id="analyzeSpinner"></span>
      </button>
    </div>
    <div class="error-box" id="errorBox"></div>
    <div class="result-box" id="resultBox">
      <h3>📝 Transcript</h3>
      <div class="transcript-text" id="transcriptText"></div>
      <div class="kw-list" id="kwList"></div>
    </div>
  </div>

  <!-- Recordings Table -->
  <div class="card">
    ${files.length === 0
      ? '<p class="empty">No recordings yet. Start Armor.ai on your phone and speak.</p>'
      : `<table>
          <thead><tr>
            <th>File</th><th>Recorded</th><th>Duration</th>
            <th>Size</th><th>Transcript</th><th>Expires</th><th>Actions</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`}
  </div>

  <script>
    let selectedFile = null;

    // Drag & drop
    const dz = document.getElementById('dropZone');
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
    dz.addEventListener('drop', e => {
      e.preventDefault(); dz.classList.remove('drag');
      const f = e.dataTransfer.files[0];
      if (f) setFile(f);
    });

    document.getElementById('fileInput').addEventListener('change', e => {
      if (e.target.files[0]) setFile(e.target.files[0]);
    });

    function setFile(f) {
      selectedFile = f;
      document.getElementById('fiName').textContent = f.name;
      document.getElementById('fiSize').textContent = (f.size / 1024).toFixed(1) + ' KB · ' + (f.type || 'audio');
      document.getElementById('fileInfo').style.display = 'flex';
      document.getElementById('uploadBtn').disabled = false;
      document.getElementById('analyzeBtn').disabled = false;
      document.getElementById('resultBox').style.display = 'none';
      document.getElementById('errorBox').style.display = 'none';
    }

    function clearFile() {
      selectedFile = null;
      document.getElementById('fileInput').value = '';
      document.getElementById('fileInfo').style.display = 'none';
      document.getElementById('uploadBtn').disabled = true;
      document.getElementById('analyzeBtn').disabled = true;
      document.getElementById('resultBox').style.display = 'none';
      document.getElementById('errorBox').style.display = 'none';
    }

    function showError(msg) {
      const b = document.getElementById('errorBox');
      b.textContent = msg; b.style.display = 'block';
    }

    function setLoading(btnId, spinnerId, loading) {
      document.getElementById(btnId).disabled = loading;
      document.getElementById(spinnerId).style.display = loading ? 'inline-block' : 'none';
    }

    async function doUpload() {
      if (!selectedFile) return;
      setLoading('uploadBtn', 'uploadSpinner', true);
      document.getElementById('errorBox').style.display = 'none';
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('recordedAt', new Date().toISOString());
      try {
        const r = await fetch('/upload', { method: 'POST', body: fd });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Upload failed (' + r.status + ')');
        alert('Uploaded: ' + j.filename);
        location.reload();
      } catch(e) { showError(e.message); }
      finally { setLoading('uploadBtn', 'uploadSpinner', false); }
    }

    async function doAnalyze() {
      if (!selectedFile) return;
      setLoading('analyzeBtn', 'analyzeSpinner', true);
      document.getElementById('errorBox').style.display = 'none';
      document.getElementById('resultBox').style.display = 'none';
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('recordedAt', new Date().toISOString());
      try {
        const r = await fetch('/analyze', { method: 'POST', body: fd });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Analyze failed (' + r.status + ')');
        const rb = document.getElementById('resultBox');
        document.getElementById('transcriptText').textContent = j.transcript || '(No transcript — connect STT pipeline)';
        const kwl = document.getElementById('kwList');
        kwl.innerHTML = (j.keywords || []).map(k => '<span class="kw">' + k + '</span>').join('');
        rb.style.display = 'block';
      } catch(e) { showError(e.message); }
      finally { setLoading('analyzeBtn', 'analyzeSpinner', false); }
    }
  </script>
</body>
</html>`);
});

// ── API: Upload ───────────────────────────────────────────────────────────────

app.post('/upload', (req, res) => {
  upload.single('file')(req, res, err => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file received. Make sure field name is "file".' });

    const now = new Date().toISOString();
    writeMeta(req.file.path, {
      id:          req.body.id || Date.now().toString(),
      mode:        req.body.mode || 'adaptive',
      timestamp:   req.body.timestamp || now,
      recordedAt:  req.body.recordedAt || req.body.timestamp || now,
      durationSec: Number(req.body.durationSec || 0),
      filename:    req.file.filename,
    });

    console.log(`[UPLOAD] ${req.file.filename} ${(req.file.size/1024).toFixed(1)}KB`);
    res.json({ ok: true, filename: req.file.filename });
  });
});

// ── API: Analyze ──────────────────────────────────────────────────────────────
// Saves the file + returns transcript/keywords.
// To add real STT: replace the stub block below with a call to Whisper/Vosk/etc.

app.post('/analyze', (req, res) => {
  upload.single('file')(req, res, err => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file received. Make sure field name is "file".' });

    const now = new Date().toISOString();

    // ── STT stub — replace this block with real transcription ──────────────
    // Example with Whisper (Python side-car):
    //   const { execSync } = require('child_process');
    //   const result = execSync(`whisper ${req.file.path} --model base --output_format json`);
    //   const transcript = JSON.parse(result).text;
    const transcript = '';   // ← replace with real STT output
    const keywords   = [];   // ← replace with NLP keyword extraction
    const emotions   = [];   // ← replace with emotion detection
    // ───────────────────────────────────────────────────────────────────────

    writeMeta(req.file.path, {
      id:          req.body.id || Date.now().toString(),
      mode:        req.body.mode || 'adaptive',
      timestamp:   req.body.timestamp || now,
      recordedAt:  req.body.recordedAt || req.body.timestamp || now,
      durationSec: Number(req.body.durationSec || 0),
      filename:    req.file.filename,
      transcript,
      keywords,
      emotions,
    });

    console.log(`[ANALYZE] ${req.file.filename} ${(req.file.size/1024).toFixed(1)}KB`);
    res.json({ ok: true, filename: req.file.filename, transcript, keywords, emotions });
  });
});

// ── API: List recordings ──────────────────────────────────────────────────────

app.get('/recordings', (_, res) => res.json(getFiles()));

// ── API: Stream recording ─────────────────────────────────────────────────────

app.get('/recordings/:filename', (req, res) => {
  const fp = path.join(UPLOADS_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(fp)) return res.status(404).json({ error: 'Not found' });
  const ext = path.extname(fp).toLowerCase();
  res.setHeader('Content-Type', MIME_MAP[ext] || 'audio/octet-stream');
  res.setHeader('Accept-Ranges', 'bytes');
  fs.createReadStream(fp).pipe(res);
});

// ── API: Delete recording ─────────────────────────────────────────────────────

app.delete('/recordings/:filename', (req, res) => {
  const fp = path.join(UPLOADS_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(fp)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(fp);
  const mp = metaPath(fp);
  if (fs.existsSync(mp)) fs.unlinkSync(mp);
  res.json({ ok: true });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  console.log('\nArmor.ai Server ready');
  console.log(`  Port: ${PORT}  |  Auto-delete: 1h\n`);
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`  -> http://${net.address}:${PORT}`);
      }
    }
  }
  console.log('');
});
