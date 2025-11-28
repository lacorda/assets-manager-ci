const fs = require('fs');
const path = require('path');
const { humanSize } = require('./utils');

async function generateReport(root, result) {
  const sorted = [...result.images].sort((a, b) => {
    if (a.used === b.used) return 0;
    return a.used ? -1 : 1;
  });
  const rows = sorted.map(img => {
    const used = img.used ? '是' : '否';
    const size = humanSize(img.size);
    const preview = `<img src="${img.rel}" alt="" style="max-width:120px;max-height:120px;object-fit:contain">`;
    const trClass = img.used ? '' : ' class="unused"';
    return `<tr${trClass}><td>${img.rel}</td><td>${size}</td><td>${used}</td><td>${preview}</td></tr>`;
  }).join('');
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>图片资产报告</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}th{background:#f5f5f5;text-align:left}caption{margin-bottom:12px;font-weight:600}section{margin-bottom:16px}.unused td{color:green}</style></head><body><h1>图片资产报告</h1><section><div>全部图片数量：${result.totals.allCount}</div><div>全部图片总大小：${humanSize(result.totals.allSize)}</div><div>已使用图片数量：${result.totals.usedCount}</div><div>已使用图片总大小：${humanSize(result.totals.usedSize)}</div><div>未使用图片数量：${result.totals.unusedCount}</div><div>未使用图片总大小：${humanSize(result.totals.unusedSize)}</div></section><table><caption>图片列表</caption><thead><tr><th>路径</th><th>大小</th><th>是否被使用</th><th>预览</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  const out = path.join(root, 'assets-report.html');
  fs.writeFileSync(out, html, 'utf8');
}

module.exports = { generateReport };
