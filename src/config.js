const fs = require('fs');
const path = require('path');

function loadConfig(root) {
  const cfg = { ignore: [] };
  const rcPath = path.join(root, '.assetsmanagerrc');
  if (fs.existsSync(rcPath)) {
    try {
      const raw = fs.readFileSync(rcPath, 'utf8');
      const obj = JSON.parse(raw);
      if (obj && Array.isArray(obj.ignore)) cfg.ignore.push(...obj.ignore);
    } catch {}
  }
  const yml1 = path.join(root, '.assetsmanagerrc.yml');
  const yml2 = path.join(root, '.assetsmanagerrc.yaml');
  for (const yp of [yml1, yml2]) {
    if (fs.existsSync(yp)) {
      try {
        const raw = fs.readFileSync(yp, 'utf8');
        const list = parseYamlIgnore(raw);
        if (Array.isArray(list)) cfg.ignore.push(...list);
      } catch {}
    }
  }
  const pkgPath = path.join(root, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const am = pkg.assetsManager || pkg['assets-manager'] || pkg.assetsmanager;
      if (am && Array.isArray(am.ignore)) cfg.ignore.push(...am.ignore);
    } catch {}
  }
  const env = process.env.ASSETS_MANAGER_IGNORE;
  if (env && typeof env === 'string') {
    env.split(',').map(s=>s.trim()).filter(Boolean).forEach(p=>cfg.ignore.push(p));
  }
  return cfg;
}

module.exports = { loadConfig };

function parseYamlIgnore(raw) {
  const lines = raw.split(/\r?\n/);
  let inList = false;
  const out = [];
  for (let line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    if (!inList) {
      if (/^ignore\s*:\s*$/.test(t)) { inList = true; continue; }
      const m = t.match(/^ignore\s*:\s*\[(.*)\]\s*$/);
      if (m) {
        const inner = m[1];
        inner.split(',').map(s=>s.trim()).filter(Boolean).forEach(p=>{
          const q = p.replace(/^['"]|['"]$/g, '');
          if (q) out.push(q);
        });
        return out;
      }
    } else {
      if (/^[^\s].*:\s*$/.test(t)) break;
      const mm = t.match(/^[-]\s*(.+)$/);
      if (mm) {
        const q = mm[1].trim().replace(/^['"]|['"]$/g, '');
        if (q) out.push(q);
      }
    }
  }
  return out;
}
