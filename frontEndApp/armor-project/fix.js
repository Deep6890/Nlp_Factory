const fs   = require('fs');
const path = require('path');

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(full));
    else if (/\.(jsx?|css|tsx?|json)$/.test(e.name) && e.name !== 'package.json') out.push(full);
  }
  return out;
}

let fixed = 0, skipped = 0;

for (const file of walk('src')) {
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.includes('<<<<<<<')) { skipped++; continue; }

  // Normalize to LF for processing, restore CRLF at end if needed
  const hasCRLF = raw.includes('\r\n');
  const txt = hasCRLF ? raw.replace(/\r\n/g, '\n') : raw;

  // Match: <<<<<<< HEAD\n...HEAD content...=======\n...OTHER content...>>>>>>> hash\n
  // The HEAD content is group 1 — we keep it, discard the rest
  const resolved = txt.replace(
    /<<<<<<< HEAD\n([\s\S]*?)=======\n[\s\S]*?>>>>>>>[^\n]*\n?/g,
    '$1'
  );

  if (resolved === txt) {
    console.log('WARN no match:', path.basename(file));
    continue;
  }

  const out = hasCRLF ? resolved.replace(/\n/g, '\r\n') : resolved;
  fs.writeFileSync(file, out, 'utf8');
  console.log('Fixed:', path.relative('src', file));
  fixed++;
}

console.log(`\nDone — fixed: ${fixed}, already clean: ${skipped}`);
