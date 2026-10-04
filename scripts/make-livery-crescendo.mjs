// Builds public/liveries/crescendo-stripes.png: the original stripe "Crescendo" livery drawn straight onto the Body UV layout (4096², alpha).
// UV space here is glTF's (v = 0 at the top of the image), which is what the livery texture samples with flipY = false.
// Island positions (1024 units) were read off a zone map of the GLB: +x flank = the upright island at y 210-390 with the
// nose on the left; the -x flank is the same island mirrored about y = 201.5; the bonnet is x 205-340, y 495-655 (nose at
// the top); the engine cover is x 35-185, y 455-775. Numbers stay symmetric ("8") because island handedness is unverified.
import sharp from 'sharp';

const RED = '#C8102E', WHITE = '#FFFFFF', YELLOW = '#F2B705', INK = '#1A1A1A';

// the flank graphic, drawn once for the +x island. The panel above the rear arch is too shallow for an open hairpin,
// so the crescendo opens across the door (apex behind the front wheel, mouth at the rear arch) and the upper line
// carries on along the shoulder to the tail.
const apex = [486, 342];
const mouthTop = [700, 296];
const mouthBottom = [694, 354];
const tail = [855, 280];
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const staff = [0.18, 0.34, 0.5, 0.66, 0.82]
  .map((t) => { const e = lerp(mouthTop, mouthBottom, t); return `<line x1="${apex[0] + 16}" y1="${apex[1]}" x2="${e[0]}" y2="${e[1]}" stroke="${WHITE}" stroke-width="1.8" stroke-linecap="round"/>`; })
  .join('');
// red lines carry a white border (drawn underneath, wider) so they still read on navy in a dark room
const redLine = (el) => el(WHITE, 13) + el(RED, 9);
const flank = `
  ${redLine((c, w) => `<polyline points="${apex.join(',')} ${mouthTop.join(',')} ${tail.join(',')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`)}
  ${redLine((c, w) => `<line x1="${apex[0]}" y1="${apex[1]}" x2="${mouthBottom[0]}" y2="${mouthBottom[1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`)}
  <line x1="${apex[0] + 12}" y1="${apex[1] + 8}" x2="${mouthBottom[0]}" y2="${mouthBottom[1] + 9}" stroke="${YELLOW}" stroke-width="1.8" stroke-linecap="round"/>
  ${staff}`;

// bonnet: twin red stripes either side of the centreline with a white pinstripe each, and the number roundel between them
const bonnetCx = 272.5;
const twin = (cx, y0, y1) => [-1, 1].map((s) => `
  <rect x="${cx + s * 11 - (s < 0 ? 18 : 0)}" y="${y0}" width="18" height="${y1 - y0}" fill="${RED}"/>
  <rect x="${cx + s * 31 - (s < 0 ? 2.5 : 0)}" y="${y0}" width="2.5" height="${y1 - y0}" fill="${WHITE}"/>`).join('');
const roundel = (cx, cy, r) => `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${WHITE}"/>
  <circle cx="${cx}" cy="${cy}" r="${r - 2.2}" fill="none" stroke="${INK}" stroke-width="1.4"/>
  <text x="${cx}" y="${cy + r * 0.48}" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="${r * 1.35}" text-anchor="middle" fill="${INK}">8</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="4096" viewBox="0 0 1024 1024">
  <g>${flank}</g>
  <g transform="translate(0 403) scale(1 -1)">${flank}</g>
  ${twin(bonnetCx, 490, 660)}
  ${roundel(bonnetCx, 560, 13)}
  ${twin(110, 450, 780)}
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/liveries/crescendo-stripes.png');
console.log('wrote public/liveries/crescendo-stripes.png');
