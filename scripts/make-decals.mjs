// Placeholder decal PNGs; swap in your own artwork. usage: node scripts/make-decals.mjs
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('public/decals', { recursive: true });

const svgs = {
  'soundwave.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 512">
    <g fill="none" stroke="#DCE3F0" stroke-linecap="round" stroke-width="22">
      ${Array.from({ length: 28 }, (_, i) => {
        const x = 60 + i * 33;
        const h = 40 + 200 * Math.abs(Math.sin(i * 0.55)) * (i < 14 ? 1 : 0.7);
        return `<line x1="${x}" y1="${256 - h / 2}" x2="${x}" y2="${256 + h / 2}"/>`;
      }).join('')}
    </g>
    <g fill="none" stroke="#B6A0F7" stroke-linecap="round" stroke-width="22">
      ${Array.from({ length: 6 }, (_, i) => {
        const x = 60 + (i + 8) * 33;
        const h = 60 + 260 * Math.abs(Math.sin((i + 8) * 0.55));
        return `<line x1="${x}" y1="${256 - h / 2}" x2="${x}" y2="${256 + h / 2}"/>`;
      }).join('')}
    </g>
  </svg>`,
  'stripe.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 256">
    <rect x="0" y="40" width="1024" height="60" fill="#F2F0EA"/>
    <rect x="0" y="130" width="1024" height="24" fill="#B6A0F7"/>
  </svg>`,
  'roundel.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <circle cx="256" cy="256" r="230" fill="#F2F0EA"/>
    <circle cx="256" cy="256" r="196" fill="none" stroke="#1F3E77" stroke-width="18"/>
    <text x="256" y="300" font-family="Manrope, Arial, sans-serif" font-weight="800" font-size="150" text-anchor="middle" fill="#1F3E77">01</text>
  </svg>`,
};

const names = [];
for (const [file, svg] of Object.entries(svgs)) {
  const png = file.replace('.svg', '.png');
  await sharp(Buffer.from(svg)).png().toFile(`public/decals/${png}`);
  names.push(png);
}
writeFileSync('public/decals/manifest.json', JSON.stringify(names, null, 2));
console.log('decals:', names.join(', '));
