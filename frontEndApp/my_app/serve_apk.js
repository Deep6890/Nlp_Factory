const http = require('http');
const fs   = require('fs');
const os   = require('os');

const APK_PATH = 'build/app/outputs/flutter-apk/app-release.apk';
const PORT     = 8080;

http.createServer((req, res) => {
  if (req.url === '/install' || req.url === '/armor-ai.apk') {
    const stat = fs.statSync(APK_PATH);
    res.writeHead(200, {
      'Content-Type':        'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename=armor-ai.apk',
      'Content-Length':      stat.size,
    });
    fs.createReadStream(APK_PATH).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Armor.ai Install</title>
  <style>
    body { font-family: sans-serif; background: #F5F0E8; padding: 40px 24px; text-align: center; }
    h1   { color: #3D5A3E; font-size: 28px; margin-bottom: 8px; }
    p    { color: #6B6B6B; font-size: 14px; margin-bottom: 32px; }
    a    { display: inline-block; background: #3D5A3E; color: #F5F0E8;
           padding: 18px 40px; border-radius: 14px; text-decoration: none;
           font-size: 18px; font-weight: 700; }
    .note { margin-top: 28px; font-size: 12px; color: #AAA; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>🛡 Armor.ai</h1>
  <p>Tap below to download and install directly on your Android phone.</p>
  <a href="/install">⬇ Install Armor.ai</a>
  <div class="note">
    Before installing, enable<br>
    <b>Settings → Apps → Special app access → Install unknown apps</b><br>
    for your browser.
  </div>
</body>
</html>`);
  }
}).listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  console.log('\n🛡  Armor.ai APK Server');
  console.log('   Open this URL on your phone browser:\n');
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`   ➜  http://${net.address}:${PORT}`);
      }
    }
  }
  console.log('\n   Phone and PC must be on the same Wi-Fi.\n');
});
