// Builds a "generating" frame of a livery for the AI loading state: the wrap is revealed from the nose back to a scan
// line, the rest of the car still shows its Paint under a faint lavender grid. Reads public/liveries/<name>.png and
// writes public/liveries/<name>-loading-<pct>.png.
// UV facts: flanks run nose (x ~296) to tail (x ~876) on both islands in y 0-410; bonnet x 195-355 y 485-785 (nose end,
// revealed early); engine cover x 25-195 y 445-785 (tail end, revealed last).
// usage: node scripts/make-livery-loading.mjs [name] [pct]
import sharp from 'sharp';

const name = process.argv[2] ?? 'risonanza';
const pct = Number(process.argv[3] ?? 55);
const X0 = 296, X1 = 876;
const xr = X0 + (X1 - X0) * (pct / 100);
const LAV = '#B6A0F7';

const S = 4096, k = S / 1024;
const svg = (body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 1024 1024">${body}</svg>`);

// what is already generated: flanks up to the scan line, and the bonnet (the nose end)
const mask = svg(`<rect x="0" y="0" width="${xr}" height="412" fill="#fff"/>${pct >= 25 ? '<rect x="195" y="485" width="160" height="300" fill="#fff"/>' : ''}`);
const revealed = await sharp(`public/liveries/${name}.png`).resize(S, S).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();

// the part still being generated: a lavender dot grid fading away from the scan line
const dots = [];
for (let x = Math.ceil(xr / 8) * 8; x < 920; x += 9)
  for (let y = 4; y < 412; y += 9) {
    const fade = Math.max(0, 1 - (x - xr) / 260);
    if (fade > 0.02) dots.push(`<circle cx="${x}" cy="${y}" r="1.7" fill="${LAV}" fill-opacity="${(0.3 + 0.7 * fade).toFixed(2)}"/>`);
  }
// the scan line: a soft lavender band with a white-hot core, and a short afterglow trailing onto the revealed wrap
const scan = `
  <defs>
    <filter id="b" x="-50%" y="-5%" width="200%" height="110%"><feGaussianBlur stdDeviation="10"/></filter>
    <linearGradient id="trail" x1="0" x2="1"><stop offset="0" stop-color="${LAV}" stop-opacity="0"/><stop offset="1" stop-color="${LAV}" stop-opacity="0.85"/></linearGradient>
  </defs>
  <rect x="${xr - 110}" y="0" width="110" height="412" fill="url(#trail)"/>
  <rect x="${xr - 18}" y="0" width="36" height="412" fill="${LAV}" filter="url(#b)"/><rect x="${xr - 8}" y="0" width="16" height="412" fill="#E4DAFF" filter="url(#b)"/>
  <rect x="${xr - 5}" y="0" width="10" height="412" fill="${LAV}"/>
  <rect x="${xr - 2.2}" y="0" width="4.4" height="412" fill="#FFFFFF"/>`;

await sharp({ create: { width: S, height: S, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: svg(dots.join('')) }, { input: revealed }, { input: svg(scan) }])
  .png().toFile(`public/liveries/${name}-loading-${pct}.png`);
console.log('wrote', `${name}-loading-${pct}.png`, 'scan at x', xr.toFixed(0), k);
