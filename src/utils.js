function humanSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v = v / 1024;
    i++;
  }
  return (i === 0 ? v : v.toFixed(2)) + ' ' + units[i];
}

module.exports = { humanSize };
