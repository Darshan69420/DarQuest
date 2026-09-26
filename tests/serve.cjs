// Static file server: play the game locally, and serve it for the test suite. A drop-in for
// `python -m http.server` that tolerates many parallel browser connections.
//   node tests/serve.cjs          # http://localhost:8123 (what the tests expect)
//   node tests/serve.cjs 8000     # any other port, e.g. if 8123 is taken
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = +(process.argv[2] || process.env.PORT || 8123);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let file = path.normalize(path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') console.error(`Port ${PORT} is already in use (another copy of the game, or another server). Try: node tests/serve.cjs ${PORT === 8000 ? 8080 : 8000}`);
  else console.error(err.message);
  process.exit(1);
}).listen(PORT, () => console.log(`Sol Mage is running: open http://localhost:${PORT} in your browser (Ctrl+C to stop)`));
