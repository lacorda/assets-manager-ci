const fs = require('fs');
const path = require('path');

function promptYes() {
  return new Promise(resolve => {
    process.stdout.write('确认删除未被引用的图片？输入 yes 确认： ');
    const onData = chunk => {
      const t = String(chunk).trim().toLowerCase();
      process.stdin.pause();
      process.stdin.removeListener('data', onData);
      resolve(t === 'yes');
    };
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', onData);
  });
}

async function deleteUnused(root, result, opts) {
  const unused = result.images.filter(i => !i.used);
  if (unused.length === 0) {
    process.stdout.write('没有未被引用的图片\n');
    return;
  }
  process.stdout.write('未被引用的图片数量：' + unused.length + '\n');
  if (!opts.yes) {
    const ok = await promptYes();
    if (!ok) {
      process.stdout.write('取消删除\n');
      return;
    }
  }
  const logFile = path.join(root, 'assets-delete.log');
  for (const img of unused) {
    try {
      fs.unlinkSync(img.path);
      const line = new Date().toISOString() + ' ' + img.rel + '\n';
      fs.appendFileSync(logFile, line);
      process.stdout.write('已删除 ' + img.rel + '\n');
    } catch (e) {
      process.stderr.write('删除失败 ' + img.rel + '\n');
    }
  }
  process.stdout.write('删除完成。日志文件：' + logFile + '\n');
}

module.exports = { deleteUnused };
