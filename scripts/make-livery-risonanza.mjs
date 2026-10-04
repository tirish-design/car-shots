// Builds public/liveries/risonanza.png: a composed full wrap (not a scattered pattern). A midnight-indigo body with
// fine grain, and on each flank one long waveform that swells from a whisper at the nose to full volume at the tail,
// shading lavender -> magenta -> coral -> amber along its length and glowing on a five-line staff. The bonnet carries
// the quiet (lavender) end of the same sound, the engine cover the loud (amber) end.
// UV facts as in make-livery-crescendo.mjs: +x flank island upright at y 210-390 nose left, -x flank mirrored about
// y = 201.5, bonnet x 205-340 y 495-655 nose at the top, engine cover x 35-185 y 455-775.
// Also writes exports/livery-thumbs/risonanza.png (a crop of the flank waveform).
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

let seed = 20260930;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const f1 = (n) => n.toFixed(1);

const STOPS = [['0', '#B6A0F7'], ['0.38', '#E45CF0'], ['0.68', '#FF5A6E'], ['1', '#FFB547']];
const grad = (id, x1, y1, x2, y2) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${STOPS.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;

// an audio-looking envelope: a swell (t^1.5) carrying beats and noise, never quite silent
const level = (t, i) => {
  const beat = 0.55 + 0.45 * Math.abs(Math.sin(i * 0.21) * Math.cos(i * 0.057 + 1.3));
  return (0.18 + 0.82 * t ** 1.3) * beat * (0.7 + 0.3 * rnd());
};

// flank: bars along x from nose (x0) to tail (x1), centred on cy
const FLANK = { x0: 296, x1: 876, cy: 334, amp: 80, step: 6, w: 2.8 };
const flankBars = (() => {
  let s = '';
  for (let i = 0, x = FLANK.x0; x <= FLANK.x1; i++, x += FLANK.step) {
    const t = (x - FLANK.x0) / (FLANK.x1 - FLANK.x0);
    const h = Math.max(1.2, FLANK.amp * level(t, i));
    s += `<line x1="${f1(x)}" y1="${f1(FLANK.cy - h)}" x2="${f1(x)}" y2="${f1(FLANK.cy + h)}"/>`;
  }
  return s;
})();
const staff = [-2, -1, 0, 1, 2].map((k) => {
  const y = FLANK.cy + k * 10;
  return `<line x1="${FLANK.x0 - 30}" y1="${y}" x2="${FLANK.x1 + 40}" y2="${y}" stroke="#F4F2EC" stroke-opacity="${k === 0 ? 0 : 0.55}" stroke-width="${k === 0 ? 1.4 : 0.8}"/>`;
}).join('');
const flank = `
  <rect x="200" y="195" width="760" height="215" fill="url(#gFlank)"/>
  ${staff}
  <g stroke="#140F26" stroke-width="${FLANK.w * 1.5}" stroke-linecap="round" opacity="0.28" filter="url(#glow)">${flankBars}</g>
  <g stroke="#FFFFFF" stroke-width="${FLANK.w}" stroke-linecap="round">${flankBars}</g>
  <g stroke="#140F26" stroke-opacity="0.5" stroke-width="0.9" stroke-linecap="round" transform="translate(0 0)">${flankBars.replace(/y1="[^"]+"/g, (m) => m).replace(/<line x1="([^"]+)" y1="([^"]+)" x2="[^"]+" y2="([^"]+)"\/>/g, (_, x, y1, y2) => { const a = +y1, b = +y2, m = (a + b) / 2, q = (b - a) * 0.08; return `<line x1="${x}" y1="${f1(m - q)}" x2="${x}" y2="${f1(m + q)}"/>`; })}</g>
  <line x1="${FLANK.x0 - 30}" y1="${FLANK.cy}" x2="${FLANK.x1 + 40}" y2="${FLANK.cy}" stroke="#140F26" stroke-opacity="0.7" stroke-width="1.2"/>`;

// bonnet: the quiet end, mirrored left/right about the centreline, nose (y 495) to windscreen (y 655)
const BON = { cx: 272.5, y0: 492, y1: 660, amp: 60, step: 6 };
const bonnetBars = (() => {
  let s = '';
  for (let i = 0, y = BON.y0; y <= BON.y1; i++, y += BON.step) {
    const t = (y - BON.y0) / (BON.y1 - BON.y0);
    const h = Math.max(1, BON.amp * (0.3 + 0.7 * t) * (0.6 + 0.4 * Math.abs(Math.sin(i * 0.37))) * (0.75 + 0.25 * rnd()));
    s += `<line x1="${f1(BON.cx - h)}" y1="${f1(y)}" x2="${f1(BON.cx + h)}" y2="${f1(y)}"/>`;
  }
  return s;
})();
const bonnet = `
  <rect x="195" y="485" width="160" height="300" fill="url(#gBonnet)" opacity="1"/>
  <line x1="${BON.cx}" y1="${BON.y0 - 10}" x2="${BON.cx}" y2="${BON.y1 + 10}" stroke="#F4F2EC" stroke-opacity="0.5" stroke-width="0.8"/>
  <g stroke="#140F26" stroke-width="4.2" stroke-linecap="round" opacity="0.25" filter="url(#glow)">${bonnetBars}</g>
  <g stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round">${bonnetBars}</g>`;

// engine cover: the loud end, a tall mirrored spectrum
const DECK = { cx: 110, y0: 452, y1: 778, amp: 66, step: 6 };
const deckBars = (() => {
  let s = '';
  for (let i = 0, y = DECK.y0; y <= DECK.y1; i++, y += DECK.step) {
    const h = Math.max(1, DECK.amp * (0.35 + 0.65 * Math.abs(Math.sin(i * 0.11) * Math.cos(i * 0.043))) * (0.7 + 0.3 * rnd()));
    s += `<line x1="${f1(DECK.cx - h)}" y1="${f1(y)}" x2="${f1(DECK.cx + h)}" y2="${f1(y)}"/>`;
  }
  return s;
})();
const deck = `
  <rect x="25" y="445" width="170" height="340" fill="url(#gDeck)" opacity="1"/>
  <g stroke="#140F26" stroke-width="4.2" stroke-linecap="round" opacity="0.25" filter="url(#glow)">${deckBars}</g>
  <g stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round">${deckBars}</g>`;

// grain + faint diagonal hairlines everywhere, so the seams between islands disappear into texture
const grain = Array.from({ length: 9000 }, () =>
  `<circle cx="${f1(rnd() * 1024)}" cy="${f1(rnd() * 1024)}" r="${f1(0.35 + rnd() * 0.9)}" fill="${rnd() < 0.6 ? '#FFFFFF' : '#140F26'}" fill-opacity="${f1(0.06 + rnd() * 0.14)}"/>`).join('');
const hair = Array.from({ length: 70 }, (_, i) =>
  `<line x1="${-200 + i * 22}" y1="-20" x2="${-200 + i * 22 + 600}" y2="1044" stroke="#FFFFFF" stroke-opacity="0.06" stroke-width="0.6"/>`).join('');

const defs = `<defs>
  ${grad('gFlank', FLANK.x0, 0, FLANK.x1, 0)}
  <linearGradient id="gBonnet" gradientUnits="userSpaceOnUse" x1="0" y1="${BON.y0}" x2="0" y2="${BON.y1}"><stop offset="0" stop-color="#B6A0F7"/><stop offset="1" stop-color="#D86CF2"/></linearGradient>
  <linearGradient id="gDeck" gradientUnits="userSpaceOnUse" x1="0" y1="${DECK.y0}" x2="0" y2="${DECK.y1}"><stop offset="0" stop-color="#FF5A6E"/><stop offset="1" stop-color="#FFB547"/></linearGradient>
  <radialGradient id="gBase" cx="0.5" cy="0.5" r="0.75"><stop offset="0" stop-color="#F0609A"/><stop offset="1" stop-color="#D84FC0"/></radialGradient>
  <linearGradient id="gFade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.55" stop-color="#fff" stop-opacity="0.08"/><stop offset="1" stop-color="#fff" stop-opacity="0.2"/></linearGradient>
  <mask id="mFlank" maskUnits="userSpaceOnUse" x="260" y="200" width="660" height="200"><rect x="260" y="200" width="660" height="200" fill="url(#gFade)"/></mask>
  <filter id="glow" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>`;

const body = `${defs}
  <rect width="1024" height="1024" fill="url(#gBase)"/>
  ${hair}${grain}
  <g>${flank}</g>
  <g transform="translate(0 403) scale(1 -1)">${flank}</g>
  ${bonnet}${deck}`;

const svg = (viewBox, w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}">${body}</svg>`;
mkdirSync('exports/livery-thumbs', { recursive: true });
await sharp(Buffer.from(svg('0 0 1024 1024', 4096, 4096))).png().toFile('public/liveries/risonanza.png');
await sharp(Buffer.from(svg('640 226 160 160', 1024, 1024))).png().toFile('exports/livery-thumbs/risonanza.png');
console.log('wrote risonanza');
