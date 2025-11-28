const path = require('path');
const { scan } = require('./scan');
const { loadConfig } = require('./config');
const { generateReport } = require('./report');
const { deleteUnused } = require('./delete');

function parseArgs(argv) {
  const args = argv.slice(2);
  const cmd = args[0] || 'report';
  const opts = { dir: process.cwd(), yes: false, ignore: [] };
  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a === '--dir' && args[i + 1]) {
      opts.dir = path.resolve(args[i + 1]);
      i++;
    } else if (a.startsWith('--dir=')) {
      opts.dir = path.resolve(a.split('=')[1]);
    } else if (a === '--yes' || a === '-y') {
      opts.yes = true;
    } else if (a === '--ignore' && args[i + 1]) {
      const val = args[i + 1];
      i++;
      val.split(',').map(s=>s.trim()).filter(Boolean).forEach(p=>opts.ignore.push(p));
    } else if (a.startsWith('--ignore=')) {
      const val = a.split('=')[1] || '';
      val.split(',').map(s=>s.trim()).filter(Boolean).forEach(p=>opts.ignore.push(p));
    }
  }
  return { cmd, opts };
}

async function main() {
  const { cmd, opts } = parseArgs(process.argv);
  if (cmd !== 'report' && cmd !== 'delete') {
    process.stderr.write('Usage: assets-manager [report|delete] [--dir <path>] [--yes] [--ignore <glob[,glob>]]\n');
    process.exit(1);
  }
  const cfg = loadConfig(opts.dir);
  const ignore = [...(cfg.ignore || []), ...(opts.ignore || [])];
  const result = await scan(opts.dir, { ignore });
  if (cmd === 'report') {
    await generateReport(opts.dir, result);
    process.stdout.write('Report generated: ' + path.join(opts.dir, 'assets-report.html') + '\n');
  } else {
    await deleteUnused(opts.dir, result, opts);
  }
}

main();
