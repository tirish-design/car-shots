// Dev helper: catches a data-URL PNG POSTed from the browser (window.__carShots.render) and writes it + a JPEG to exports/.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const out = path.resolve('exports');
fs.mkdirSync(out, { recursive: true });
const port = 5199;
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.end();
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', async () => {
    const { name, dataUrl } = JSON.parse(body);
    const png = Buffer.from(dataUrl.split(',')[1], 'base64');
    const base = path.join(out, name);
    fs.writeFileSync(base + '.png', png);
    try {
      const sharp = (await import('sharp')).default;
      await sharp(png).jpeg({ quality: 88 }).toFile(base + '.jpg');
    } catch (e) { console.log('no jpeg:', e.message); }
    console.log('saved', base, png.length);
    res.end('ok');
  });
}).listen(port, () => console.log('receiver on', port));
