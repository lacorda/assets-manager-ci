const fs = require('fs');
const path = require('path');

const imageExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico']);
const textExts = new Set([
  '.js','.ts','.jsx','.tsx','.mjs','.cjs','.json','.html','.htm','.css','.scss','.md','.txt','.xml','.yml','.yaml','.vue','.php','.py','.rb','.go','.java','.c','.cpp'
]);

function shouldIgnore(dir) {
  const base = path.basename(dir);
  if (base === 'node_modules' || base === '.git' || base === 'dist' || base === 'build' || base === 'out') return true;
  return false;
}

function walk(root, git) {
  const files = [];
  const dirs = [root];
  while (dirs.length) {
    const d = dirs.pop();
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      const rel = path.relative(root, full).split(path.sep).join('/');
      if (e.isDirectory()) {
        if (shouldIgnore(full)) continue;
        if (git && git(rel, true)) continue;
        dirs.push(full);
      } else if (e.isFile()) {
        if (git && git(rel, false)) continue;
        files.push(full);
      }
    }
  }
  return files;
}

function shouldIgnoreFile(file) {
  const base = path.basename(file).toLowerCase();
  if (base === 'assets-report.html') return true;
  if (base === 'assets-delete.log') return true;
  return false;
}

async function scan(root, options = {}) {
  const extra = Array.isArray(options.ignore) ? options.ignore : [];
  const git = loadGitignore(root, extra);
  const matcher = git ? (rel, isDir) => git.matches(rel, isDir) : null;
  const allFiles = walk(root, matcher);
  const images = [];
  const textFiles = [];
  for (const f of allFiles) {
    const ext = path.extname(f).toLowerCase();
    if (imageExts.has(ext)) images.push(f);
    else if (textExts.has(ext) && !shouldIgnoreFile(f)) textFiles.push(f);
  }
  const imageInfos = images.map(p => {
    const s = fs.statSync(p);
    const rel = path.relative(root, p).split(path.sep).join('/');
    return { path: p, rel, size: s.size, used: false };
  });
  const relIndex = new Map();
  for (const img of imageInfos) relIndex.set(img.rel, img);
  const nameIndex = new Map();
  for (const img of imageInfos) nameIndex.set(path.basename(img.rel), (nameIndex.get(path.basename(img.rel)) || []).concat(img));

  for (const tf of textFiles) {
    let content = '';
    try { content = fs.readFileSync(tf, 'utf8'); } catch {}
    for (const rel of relIndex.keys()) {
      if (content.includes(rel)) relIndex.get(rel).used = true;
    }
    for (const [name, imgs] of nameIndex.entries()) {
      if (content.includes(name)) for (const img of imgs) img.used = true;
    }
  }

  const totals = {
    allCount: imageInfos.length,
    allSize: imageInfos.reduce((a,b)=>a+b.size,0),
    usedCount: imageInfos.filter(i=>i.used).length,
    usedSize: imageInfos.filter(i=>i.used).reduce((a,b)=>a+b.size,0),
    unusedCount: imageInfos.filter(i=>!i.used).length,
    unusedSize: imageInfos.filter(i=>!i.used).reduce((a,b)=>a+b.size,0)
  };

  return { images: imageInfos, totals };
}

module.exports = { scan };

function loadGitignore(root, extraPatterns) {
  const p = path.join(root, '.gitignore');
  if (!fs.existsSync(p)) return null;
  let content = '';
  try { content = fs.readFileSync(p, 'utf8'); } catch { return null; }
  const lines = content.split(/\r?\n/);
  const rules = [];
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    let negate = false;
    if (line.startsWith('!')) {
      negate = true;
      line = line.slice(1);
    }
    const dirOnly = line.endsWith('/');
    const anchored = line.startsWith('/');
    if (dirOnly) line = line.slice(0, -1);
    if (anchored) line = line.slice(1);
    const hasSlash = line.includes('/');
    const rxPath = globToRegExp(line, true);
    const rxBase = hasSlash ? null : globToRegExp(line, false);
    rules.push({ negate, dirOnly, anchored, hasSlash, rxPath, rxBase });
  }
  if (Array.isArray(extraPatterns) && extraPatterns.length) {
    for (let pat of extraPatterns) {
      let line = pat.trim();
      if (!line) continue;
      let negate = false;
      if (line.startsWith('!')) {
        negate = true;
        line = line.slice(1);
      }
      const dirOnly = line.endsWith('/');
      const anchored = line.startsWith('/');
      if (dirOnly) line = line.slice(0, -1);
      if (anchored) line = line.slice(1);
      const hasSlash = line.includes('/');
      const rxPath = globToRegExp(line, true);
      const rxBase = hasSlash ? null : globToRegExp(line, false);
      rules.push({ negate, dirOnly, anchored, hasSlash, rxPath, rxBase });
    }
  }
  return {
    matches(rel, isDir) {
      const pathRel = rel;
      const base = path.basename(rel);
      let state = false;
      for (const r of rules) {
        if (r.dirOnly && !isDir) continue;
        let m = false;
        if (!r.hasSlash && r.rxBase) {
          m = r.rxBase.test(base);
        } else {
          if (r.anchored) m = r.rxPath.test(pathRel);
          else m = r.rxPath.anywhere.test(pathRel);
        }
        if (m) state = !r.negate;
      }
      return state;
    }
  };
}

function globToRegExp(glob, asPath) {
  let g = glob.replace(/([.+^${}()|\[\]\\])/g, '\\$1');
  g = g.replace(/\*\*/g, '.*');
  g = g.replace(/\*/g, '[^/]*');
  g = g.replace(/\?/g, '[^/]');
  const rePath = '^' + g + '$';
  const rx = new RegExp(rePath);
  if (!asPath) return rx;
  const anywhere = new RegExp('(?:^|/)' + g + '(?:/|$)');
  const r = new RegExp(rePath);
  r.anywhere = anywhere;
  return r;
}
