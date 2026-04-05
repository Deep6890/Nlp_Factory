const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = 3000;
const AUTO_DELETE_MS = 60 * 60 * 1000;

app.use(cors());
app.use(express.json());

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOADS_DIR),
  filename: (_, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage });

function readMeta(filename) {
  const metaPath = path.join(UPLOADS_DIR, filename.replace(/\.(m4a|webm|wav|mp3|ogg)$/, '.json'));
  try {
    if (fs.existsSync(metaPath)) {
      return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    }
  } catch (_) {}
  return {};
}

const AUDIO_EXTS = ['.m4a', '.webm', '.wav', '.mp3', '.ogg'];

function isAudioFile(f) {
  return AUDIO_EXTS.some(ext => f.endsWith(ext));
}
  return mode === 'adaptive' ? 'Adaptive' : 'Legacy';
}

function scheduleAutoDelete() {
  setInterval(() => {
    const now = Date.now();
    try {
      fs.readdirSync(UPLOADS_DIR)
        .filter(f => isAudioFile(f))
        .forEach(f => {
          const fp = path.join(UPLOADS_DIR, f);
          const stat = fs.statSync(fp);
          if (now - stat.mtimeMs > AUTO_DELETE_MS) {
            fs.unlinkSync(fp);
            const meta = fp.replace(/\.(m4a|webm|wav|mp3|ogg)$/, '.json');
            if (fs.existsSync(meta)) fs.unlinkSync(meta);
            console.log(`[AUTO-DELETE] ${f}`);
          }
        });
    } catch (e) {
      console.error('[AUTO-DELETE ERROR]', e.message);
    }
  }, 5 * 60 * 1000);
}
scheduleAutoDelete();

app.get('/', (_, res) => {
  const files = fs.readdirSync(UPLOADS_DIR).filter(f => isAudioFile(f));
  const rows = files.map(f => {
    const stat = fs.statSync(path.join(UPLOADS_DIR, f));
    const meta = readMeta(f);
    const kb = (stat.size / 1024).toFixed(1);
    const ageMin = Math.floor((Date.now() - stat.mtimeMs) / 60000);
    const delMin = Math.max(0, 60 - ageMin);
    const recordedAt = meta.recordedAt || meta.timestamp || stat.mtime.toISOString();
    const durationSec = Number(meta.durationSec || 0);

    return `<tr>
      <td><span class="fname">${f}</span></td>
      <td>${new Date(recordedAt).toLocaleString()}</td>
      <td>${durationSec > 0 ? `${durationSec}s` : '-'}</td>
      <td>${kb} KB</td>
      <td><span class="mode-badge">${modeLabel(meta.mode || 'adaptive')}</span></td>
      <td><span class="del-badge">Delete in ${delMin}m</span></td>
      <td><a href="/recordings/${f}" target="_blank">Play</a></td>
      <td><a href="/recordings/${f}" download>Save</a></td>
    </tr>`;
  }).join('');

  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Armor.ai Server</title>
  <meta http-equiv="refresh" content="10">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',sans-serif;background:#FFFDF6;color:#2D2D2D;padding:28px}
    h1{font-size:24px;font-weight:700;color:#3D5A3E}
    h1 span{color:#DDEB9D}
    .sub{color:#888;font-size:13px;margin:6px 0 24px}
    .badge{background:#DDEB9D;color:#3D5A3E;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600}
    .card{background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,.07);overflow:hidden}
    table{width:100%;border-collapse:collapse}
    th{background:#3D5A3E;color:#FFFDF6;padding:12px 16px;text-align:left;font-size:13px;font-weight:600}
    td{padding:11px 16px;border-bottom:1px solid #f0f0e8;font-size:13px;vertical-align:middle}
    tr:last-child td{border-bottom:none}
    tr:hover td{background:#f9fdf0}
    .fname{font-family:monospace;font-size:12px;color:#555}
    .del-badge{background:#FFF3CD;color:#856404;padding:2px 8px;border-radius:10px;font-size:11px}
    .mode-badge{background:#DDEB9D;color:#3D5A3E;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600}
    a{color:#3D5A3E;text-decoration:none;font-weight:600;margin-right:8px}
    .empty{text-align:center;padding:48px;color:#AAA;font-size:15px}
    .stats{display:flex;gap:16px;margin-bottom:20px}
    .stat{background:#fff;border-radius:12px;padding:14px 20px;flex:1;box-shadow:0 1px 6px rgba(0,0,0,.06)}
    .stat-n{font-size:28px;font-weight:700;color:#3D5A3E}
    .stat-l{font-size:12px;color:#888;margin-top:2px}
  </style>
</head>
<body>
  <h1>Armor<span>.ai</span></h1>
  <p class="sub">Adaptive recording server � <span class="badge">Live</span> � files auto-delete after 1h</p>
  <div class="stats">
    <div class="stat"><div class="stat-n">${files.length}</div><div class="stat-l">Recordings</div></div>
    <div class="stat"><div class="stat-n">${(files.reduce((s, f) => s + fs.statSync(path.join(UPLOADS_DIR, f)).size, 0) / 1024).toFixed(0)} KB</div><div class="stat-l">Total size</div></div>
    <div class="stat"><div class="stat-n">1h</div><div class="stat-l">Auto-delete</div></div>
  </div>
  <div class="card">
    ${files.length === 0
      ? '<p class="empty">No recordings yet. Start Armor.ai and speak.</p>'
      : `<table><thead><tr><th>File</th><th>Recorded</th><th>Duration</th><th>Size</th><th>Mode</th><th>Expires</th><th>Play</th><th>Save</th></tr></thead><tbody>${rows}</tbody></table>`}
  </div>
</body>
</html>`);
});

app.post('/upload', (req, res) => {
  upload.single('file')(req, res, err => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file received' });

    const mode = req.body.mode || 'adaptive';
    const metaPath = req.file.path.replace(/\.(m4a|webm|wav|mp3|ogg)$/, '.json');
    fs.writeFileSync(metaPath, JSON.stringify({
      id: req.body.id,
      mode,
      timestamp: req.body.timestamp,
      recordedAt: req.body.recordedAt || req.body.timestamp,
      durationSec: Number(req.body.durationSec || 0),
      filename: req.file.filename,
    }));

    console.log(
      `[UPLOAD] ${req.file.filename} mode=${mode} recordedAt=${req.body.recordedAt || req.body.timestamp} duration=${req.body.durationSec || 0}s`,
    );
    res.json({ ok: true, filename: req.file.filename, mode });
  });
});

app.get('/recordings', (_, res) => {
  const files = fs.readdirSync(UPLOADS_DIR).filter(f => isAudioFile(f));
  const list = files.map(f => {
    const stat = fs.statSync(path.join(UPLOADS_DIR, f));
    const meta = readMeta(f);
    return {
      id: path.basename(f, '.m4a'),
      filename: f,
      size: stat.size,
      mode: meta.mode || 'adaptive',
      recordedAt: meta.recordedAt || meta.timestamp || stat.mtime.toISOString(),
      durationSec: Number(meta.durationSec || 0),
      uploadedAt: stat.mtime.toISOString(),
      expiresIn: Math.max(0, AUTO_DELETE_MS - (Date.now() - stat.mtimeMs)),
      url: `/recordings/${f}`,
    };
  }).sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));

  res.json(list);
});

app.get('/recordings/:filename', (req, res) => {
  const fp = path.join(UPLOADS_DIR, req.params.filename);
  if (!fs.existsSync(fp)) return res.status(404).json({ error: 'Not found' });
  const ext = path.extname(req.params.filename).toLowerCase();
  const mimeMap = { '.m4a': 'audio/mp4', '.webm': 'audio/webm', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };
  res.setHeader('Content-Type', mimeMap[ext] || 'audio/octet-stream');
  fs.createReadStream(fp).pipe(res);
});

app.delete('/recordings/:filename', (req, res) => {
  const fp = path.join(UPLOADS_DIR, req.params.filename);
  if (!fs.existsSync(fp)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(fp);
  const meta = fp.replace(/\.(m4a|webm|wav|mp3|ogg)$/, '.json');
  if (fs.existsSync(meta)) fs.unlinkSync(meta);
  res.json({ ok: true });
});

app.post('/analyze', (req, res) => {
  upload.single('file')(req, res, err => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file received' });

    // Save the file same as /upload
    const metaPath = req.file.path.replace(/\.(m4a|webm|wav|mp3|ogg)$/, '.json');
    fs.writeFileSync(metaPath, JSON.stringify({
      id: req.body.id || Date.now().toString(),
      mode: req.body.mode || 'adaptive',
      timestamp: req.body.timestamp || new Date().toISOString(),
      recordedAt: req.body.recordedAt || req.body.timestamp || new Date().toISOString(),
      durationSec: Number(req.body.durationSec || 0),
      filename: req.file.filename,
    }));

    console.log(`[ANALYZE] ${req.file.filename} size=${req.file.size}`);

    // Return stub analysis — replace with real STT/NLP later
    res.json({
      ok: true,
      filename: req.file.filename,
      transcript: '',
      keywords: [],
      emotions: [],
      message: 'File received. Connect STT/NLP pipeline to process.',
    });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  console.log('\nArmor.ai Server');
  console.log(`   Port: ${PORT} | Auto-delete: 1h\n`);
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`   -> http://${net.address}:${PORT}`);
      }
    }
  }
  console.log('');
});
