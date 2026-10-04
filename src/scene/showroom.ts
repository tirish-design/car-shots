import * as THREE from 'three';

/**
 * Showroom palette and set geometry for the Backdrop: a bright gallery. Polished concrete, a curved white feature wall
 * flanked by oak wings, daylight glazing round the rest, one pendant spot over a low steel turntable.
 * Plain data: no React, so HMR stays clean.
 */
export const SHOWROOM = {
  bg: '#d8d9da',
  concrete: '#c4c4c2',
  joint: '#9d9d9b',
  plaster: '#ebe9e4',
  oak: '#c9b48e',
  oakLine: '#a88f6c',
  steel: '#a6aaae',
  steelDark: '#5f6266',
  white: '#ffffff',
  /** camera default sits at +x/-z, so the feature wall faces it from the opposite side */
  front: Math.atan2(5.6, -5.2),
  ceilingY: 5.2,
  /** the floor is sunk so the turntable top sits at y=0 where the car and its contact shadow already live */
  floorY: -0.22,
  wall: { radius: 9, half: 0.55 },
  wing: { radius: 9.25, from: 0.55, to: 1.18 },
  glass: { radius: 10.5 },
  turntable: { radius: 3.25, outer: 3.9, rim: 0.03 },
  pendant: { y: 3.9, rod: 0.035 },
};

/** A 4x4 m concrete panel: light, fine-grained, with a joint line along two edges so panels read once tiled. */
export function makeConcreteTexture(seed = 3): THREE.CanvasTexture {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = SHOWROOM.concrete;
  ctx.fillRect(0, 0, size, size);
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  // broad tonal clouds, then fine speckle
  for (let i = 0; i < 40; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = 80 + rnd() * 220;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const v = rnd() > 0.5 ? 255 : 0;
    g.addColorStop(0, `rgba(${v},${v},${v},0.05)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 9000; i++) {
    const v = rnd() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${0.03 + rnd() * 0.06})`;
    ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  ctx.strokeStyle = SHOWROOM.joint;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(1.5, 0); ctx.lineTo(1.5, size); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 1.5); ctx.lineTo(size, 1.5); ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(20, 20);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Oak veneer: vertical grain with slight tonal bands, a horizontal panel joint in the middle. */
export function makeOakTexture(seed = 11): THREE.CanvasTexture {
  const w = 512;
  const h = 1024;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = SHOWROOM.oak;
  ctx.fillRect(0, 0, w, h);
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let x = 0; x < w; x += 2) {
    const v = rnd();
    ctx.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.16})` : `rgba(90,60,30,${(0.5 - v) * 0.2})`;
    ctx.fillRect(x, 0, 2 + rnd() * 3, h);
  }
  for (let i = 0; i < 18; i++) {
    ctx.strokeStyle = `rgba(110,80,50,${0.15 + rnd() * 0.2})`;
    ctx.lineWidth = 1 + rnd();
    const x = rnd() * w;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + 6, h / 3, x - 6, (2 * h) / 3, x, h); ctx.stroke();
  }
  ctx.strokeStyle = SHOWROOM.oakLine;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1.5, 0); ctx.lineTo(1.5, h); ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Daylight seen through the glazing: pale overcast sky, a low white garden wall, lawn, and soft cypress silhouettes. */
export function makeDaylightTexture(seed = 5): THREE.CanvasTexture {
  const w = 2048;
  const h = 1024;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, '#cfd9e3');
  sky.addColorStop(1, '#eef1f3');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.62);
  ctx.fillStyle = '#e6e4df'; // garden wall
  ctx.fillRect(0, h * 0.62, w, h * 0.2);
  ctx.fillStyle = '#d9d8d3';
  ctx.fillRect(0, h * 0.815, w, h * 0.01);
  const lawn = ctx.createLinearGradient(0, h * 0.82, 0, h);
  lawn.addColorStop(0, '#9fae8c');
  lawn.addColorStop(1, '#c2c4bc');
  ctx.fillStyle = lawn;
  ctx.fillRect(0, h * 0.82, w, h * 0.18);
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  ctx.filter = 'blur(3px)';
  for (let i = 0; i < 26; i++) {
    const x = rnd() * w;
    const th = h * (0.14 + rnd() * 0.16);
    const tw = h * (0.012 + rnd() * 0.012);
    const base = h * (0.8 + rnd() * 0.06);
    ctx.fillStyle = `rgba(70,92,72,${0.5 + rnd() * 0.3})`;
    ctx.beginPath();
    ctx.moveTo(x, base - th);
    ctx.quadraticCurveTo(x + tw, base - th * 0.55, x + tw * 0.8, base);
    ctx.lineTo(x - tw * 0.8, base);
    ctx.quadraticCurveTo(x - tw, base - th * 0.55, x, base - th);
    ctx.fill();
  }
  ctx.filter = 'none';
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

/** Turntable top: dark brushed steel that brightens under the pendant, so the pool of light is baked into the disc. */
export function makeTurntableTexture(): THREE.CanvasTexture {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, '#d2d2d0');
  g.addColorStop(0.5, '#9a9a99');
  g.addColorStop(1, '#55555a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  // fine circular brushing
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let r = 4; r < size / 2; r += 3) {
    ctx.beginPath(); ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
