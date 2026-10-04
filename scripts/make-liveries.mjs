// Builds the full-wrap Livery set: each one is an all-over pattern that covers the whole 4096² sheet, so every UV
// island is painted and the Paint never shows; the busy, random layout hides the seams between islands. Each is named
// after a musical term and scatters that term's motif. Seeded per name, so reruns give the same car.
// Writes public/liveries/<name>.png and a thumbnail exports/livery-thumbs/<name>.png (a full-bleed square cut
// from the same pattern). The older stripe Crescendo lives on as crescendo-stripes.png (make-livery-crescendo.mjs).
// usage: node scripts/make-liveries.mjs [name ...]
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const WHITE = '#F4F2EC', INK = '#15161A', RED = '#D0102C', RED_DARK = '#7E0A1C', RED_LIGHT = '#F0485E', YELLOW = '#F2B705',
  LAV = '#B6A0F7', MINT = '#7FE0C2', ORANGE = '#FF6A1A', GOLD = '#C9A45C', NAVY = '#1F3E77', TEAL = '#1F5C5A';

let seed = 1;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const between = (a, b) => a + rnd() * (b - a);
const pick = (weighted) => {
  let r = rnd() * weighted.reduce((s, [, w]) => s + w, 0);
  for (const [v, w] of weighted) if ((r -= w) <= 0) return v;
  return weighted[0][0];
};
const range = (n) => Array.from({ length: n }, (_, i) => i);
const many = (n, f) => range(n).map(f).join('');
const anywhere = () => [between(-60, 1084), between(-60, 1084)];
const at = ([x, y], rot, body) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})">${body}</g>`;
const pts = (a) => a.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');
const f1 = (n) => n.toFixed(1);

const liveries = {
  // hairpins opening up, scattered like a crowd getting louder
  crescendo: { bg: '#6E0A1A', draw: () => many(1000, () => {
    const L = between(30, 130), h = L * between(0.18, 0.3);
    return at(anywhere(), between(-25, 25) + (rnd() < 0.2 ? 180 : 0),
      `<polyline points="${pts([[L, -h], [0, 0], [L, h]])}" fill="none" stroke="${pick([[WHITE, 5], [YELLOW, 2], [RED_LIGHT, 3]])}" stroke-width="${f1(between(2.5, 7))}" stroke-linejoin="miter"/>`);
  }) },
  // short detached dashes, mostly running one way
  staccato: { bg: INK, draw: () => many(1500, () => {
    const len = between(8, 34);
    return at(anywhere(), between(-30, -10), `<line x1="0" y1="0" x2="${f1(len)}" y2="0" stroke="${pick([[WHITE, 7], [LAV, 2], [RED, 1]])}" stroke-width="${f1(between(4, 9))}" stroke-linecap="round"/>`);
  }) },
  // long overlapping ribbons that never break
  legato: { bg: '#CFC3FA', draw: () => many(70, (i) => {
    const y = between(-80, 1100), d = () => between(-260, 260);
    const path = `M-120 ${f1(y)} C 200 ${f1(y + d())}, 420 ${f1(y + d())}, 560 ${f1(y + d() / 2)} S 900 ${f1(y + d())}, 1150 ${f1(y + d())}`;
    const thin = i % 3 === 0;
    return `<path d="${path}" fill="none" stroke="${thin ? INK : pick([[NAVY, 3], [TEAL, 2], [WHITE, 3]])}" stroke-width="${f1(thin ? between(1.5, 3.5) : between(12, 42))}" stroke-linecap="round"/>`;
  }) },
  // pause marks of every size, tumbling
  fermata: { bg: YELLOW, draw: () => many(1300, () => {
    const s = between(6, 34), c = pick([[INK, 7], [WHITE, 3]]);
    return at(anywhere(), between(-180, 180), `<path d="M${f1(-s)} 0 A ${f1(s)} ${f1(s)} 0 0 1 ${f1(s)} 0" fill="none" stroke="${c}" stroke-width="${f1(s * 0.24)}" stroke-linecap="round"/><circle cx="0" cy="${f1(-s * 0.25)}" r="${f1(s * 0.2)}" fill="${c}"/>`);
  }) + many(1500, () => `<circle cx="${f1(between(0, 1024))}" cy="${f1(between(0, 1024))}" r="${f1(between(1, 2.8))}" fill="${INK}"/>`) },
  // runs of slanted bars rising in pitch, lavender sliding into white
  glissando: { bg: '#2A1F4F', draw: () => many(620, () => {
    const n = 5 + Math.floor(rnd() * 5), k = between(0.5, 1.6);
    const bars = range(n).map((j) => {
      const t = j / (n - 1), x = j * 9 * k, top = -(12 + j * 7) * k;
      const c = `rgb(${Math.round(182 + 62 * t)},${Math.round(160 + 82 * t)},${Math.round(247 - 11 * t)})`;
      return `<polygon points="${pts([[x, 0], [x + 5 * k, 0], [x + 9 * k, top], [x + 4 * k, top]])}" fill="${c}"/>`;
    }).join('');
    return at(anywhere(), between(-20, 20), bars);
  }) },
  // fast zigzags of every width
  tremolo: { bg: ORANGE, draw: () => many(650, () => {
    const step = between(5, 12), amp = between(3, 11), n = 6 + Math.floor(rnd() * 20);
    return at(anywhere(), between(-35, 35), `<polyline points="${pts(range(n).map((k) => [k * step, k % 2 ? -amp : amp]))}" fill="none" stroke="${pick([[INK, 6], [WHITE, 4]])}" stroke-width="${f1(between(2, 6))}" stroke-linejoin="miter"/>`);
  }) },
  // accent marks driving forward, some doubled
  sforzando: { bg: RED, draw: () => many(1300, () => {
    const L = between(14, 70), h = L * 0.42, w = L * between(0.1, 0.18), c = pick([[INK, 6], [WHITE, 4]]);
    const mark = `<polyline points="${pts([[0, -h], [L, 0], [0, h]])}" fill="none" stroke="${c}" stroke-width="${f1(w)}" stroke-linejoin="miter"/>`;
    const twice = rnd() < 0.3 ? `<g transform="translate(${f1(L * 0.45)} 0)">${mark}</g>` : '';
    return at(anywhere(), between(-15, 15) + (rnd() < 0.25 ? 180 : 0), mark + twice);
  }) },
  // little staircases of mint, climbing in every direction
  arpeggio: { bg: '#123B35', draw: () => many(800, () => {
    const n = 3 + Math.floor(rnd() * 4), w = between(5, 14), step = between(5, 12);
    const shades = ['#2E6B5E', '#3F8F7B', MINT, '#B9EEDC', WHITE, '#E9E2FF'];
    const first = Math.floor(rnd() * (shades.length - n + 1));
    const blocks = range(n).map((j) => `<rect x="${f1(j * (w + 2))}" y="${f1(-(j + 1) * step)}" width="${f1(w)}" height="${f1((j + 1) * step)}" fill="${shades[first + j]}"/>`).join('');
    return at(anywhere(), Math.floor(rnd() * 4) * 90 + between(-8, 8), blocks);
  }) },
  // plucked dots gathering in clusters
  pizzicato: { bg: WHITE, draw: () => many(260, () => {
    const [cx, cy] = anywhere(), spread = between(20, 90);
    return many(50, () => {
      const a = between(0, Math.PI * 2), d = spread * Math.sqrt(rnd());
      return `<circle cx="${f1(cx + Math.cos(a) * d)}" cy="${f1(cy + Math.sin(a) * d)}" r="${f1(1 + 8 * rnd() ** 2.2)}" fill="${pick([[INK, 5], [RED, 3], [NAVY, 2]])}"/>`;
    });
  }) },
  // the same short figure repeated in patches, like a riff that won't stop
  ostinato: { bg: '#EDE6D6', draw: () => many(380, () => {
    const reps = 3 + Math.floor(rnd() * 8), h = between(12, 50), k = between(0.5, 1.3);
    const c = pick([[INK, 8], [RED, 1], [YELLOW, 1]]);
    const figure = range(reps).map((j) => {
      const x = j * 30 * k;
      return `<rect x="${f1(x)}" y="0" width="${f1(12 * k)}" height="${f1(h)}" fill="${c}"/><rect x="${f1(x + 17 * k)}" y="0" width="${f1(3 * k)}" height="${f1(h)}" fill="${c}"/><rect x="${f1(x + 24 * k)}" y="0" width="${f1(3 * k)}" height="${f1(h)}" fill="${c}"/>`;
    }).join('');
    return at(anywhere(), pick([[0, 5], [90, 3], [45, 1], [-45, 1]]) + between(-4, 4), figure);
  }) },
  // lines that speed up and slow down, like contours
  rubato: { bg: '#5E646E', draw: () => many(120, () => {
    const y0 = between(-100, 1124), amp = between(6, 40), f0 = between(0.004, 0.02), drift = between(-0.25, 0.25);
    const p = range(90).map((k) => {
      const x = -80 + k * 14, f = f0 * (1 + 0.8 * Math.sin(k * 0.13));
      return [x, y0 + drift * x + amp * Math.sin(x * f * 6.283)];
    });
    return `<polyline points="${pts(p)}" fill="none" stroke="${pick([[GOLD, 4], [WHITE, 3], [INK, 3]])}" stroke-width="${f1(between(1.5, 9))}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }) },
  // coda signs of every size, turned every which way
  coda: { bg: '#C3C8D0', draw: () => many(1000, () => {
    const r = between(5, 30), w = f1(r * 0.2), e = f1(r * 1.4), c = pick([[INK, 6], [RED, 3], [WHITE, 2]]);
    return at(anywhere(), between(0, 90), `<circle r="${f1(r)}" fill="none" stroke="${c}" stroke-width="${w}"/><line x1="0" y1="-${e}" x2="0" y2="${e}" stroke="${c}" stroke-width="${w}"/><line x1="-${e}" y1="0" x2="${e}" y2="0" stroke="${c}" stroke-width="${w}"/>`);
  }) },
  // angular red claws over black splinters, most of them running one way
  furioso: { bg: WHITE, draw: () => {
    const claw = (L, w, fork) => {
      const p = [[0, -w], [L * 0.55, -w * 0.55], [L, 0], [L * 0.62, w * 0.35], [L * 0.4, w * 0.95], [L * 0.2, w * 0.4], [0, w * 0.7]];
      if (fork) p.splice(4, 0, [L * 0.78, w * 1.6], [L * 0.52, w * 0.7]);
      return pts(p);
    };
    const angle = () => (rnd() < 0.78 ? between(-38, -18) : between(20, 55));
    const ink = many(900, () => at(anywhere(), angle(), `<polygon points="${claw(between(25, 90), between(2.5, 7), false)}" fill="${INK}"/>`));
    const red = many(420, () => {
      const L = between(50, 130), w = between(6, 13), p = claw(L, w, rnd() < 0.4);
      const hl = pts([[w * 0.3, -w * 0.75], [L * 0.55, -w * 0.5], [L * 0.93, -w * 0.02], [L * 0.5, -w * 0.2]]);
      return at(anywhere(), angle(), `<polygon points="${p}" fill="${INK}" transform="translate(4 5.5)"/><polygon points="${p}" fill="${RED_DARK}" transform="translate(1.8 2.4)"/><polygon points="${p}" fill="${RED}"/><polygon points="${hl}" fill="${RED_LIGHT}"/>`);
    });
    return ink + red;
  } },
};

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
mkdirSync('exports/livery-thumbs', { recursive: true });
const only = process.argv.slice(2);
for (const [name, l] of Object.entries(liveries)) {
  if (only.length && !only.includes(name)) continue;
  seed = name === 'furioso' ? 7 : hash(name);
  const body = `<rect x="-100" y="-100" width="1224" height="1224" fill="${l.bg}"/>${l.draw()}`;
  const svg = (viewBox, size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}">${body}</svg>`;
  await sharp(Buffer.from(svg('0 0 1024 1024', 4096))).png().toFile(`public/liveries/${name}.png`);
  await sharp(Buffer.from(svg('380 240 200 200', 1024))).png().toFile(`exports/livery-thumbs/${name}.png`);
  console.log('wrote', name);
}
