// Dev helper for animations: catches { dir, index, dataUrl } POSTed from the browser (window.__carGen.capture) and
// writes exports/anim/<dir>/f0000.png. Ignores empty frames instead of crashing.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const port = 5198;
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.end();
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    try {
      const { dir, index, dataUrl } = JSON.parse(body);
      if (!dataUrl) { res.statusCode = 400; return res.end('empty'); }
      const out = path.resolve('exports/anim', dir);
      fs.mkdirSync(out, { recursive: true });
      fs.writeFileSync(path.join(out, `f${String(index).padStart(4, '0')}.png`), Buffer.from(dataUrl.split(',')[1], 'base64'));
      res.end('ok');
    } catch (e) { res.statusCode = 500; res.end(String(e)); }
  });
}).listen(port, () => console.log('frames receiver on', port));
