import { describe, expect, it } from 'vitest';
import {
  defaultConfiguration,
  parseConfiguration,
  reduce,
  serialize,
  snapshotBaseName,
  type Configuration,
  type Decal,
} from './configuration';

const decal = (id: string): Decal => ({
  id,
  image: 'soundwave.png',
  position: [0.5, 0.7, 0.2],
  normal: [1, 0, 0],
  size: 0.6,
  rotation: 0,
  opacity: 1,
});

describe('Configuration reducer', () => {
  it('starts on Blu Toccata with the four default Shots', () => {
    const c = defaultConfiguration();
    expect(c.paint).toBe('blu-toccata');
    expect(c.shots.map((s) => s.name)).toEqual(['front-three-quarter', 'side', 'rear-three-quarter', 'flank-detail', 'low-hero', 'plate-hero']);
    expect(c.backdrop).toBe('transparent');
    expect(c.aspect).toBe('3:2');
    expect(c.shot).toBe('front-three-quarter');
  });

  it('sets paint by id and falls back to the default for unknown ids', () => {
    const c = defaultConfiguration();
    expect(reduce(c, { type: 'setPaint', paint: 'rosso-fortissimo' }).paint).toBe('rosso-fortissimo');
    expect(reduce(c, { type: 'setPaint', paint: 'nope' }).paint).toBe('blu-toccata');
  });

  it('sets caliper colour', () => {
    expect(reduce(defaultConfiguration(), { type: 'setCaliper', caliper: '#111111' }).caliper).toBe('#111111');
  });

  it('adds, updates, reorders and removes decals in order', () => {
    let c = defaultConfiguration();
    c = reduce(c, { type: 'addDecal', decal: decal('a') });
    c = reduce(c, { type: 'addDecal', decal: decal('b') });
    c = reduce(c, { type: 'addDecal', decal: decal('c') });
    expect(c.decals.map((d) => d.id)).toEqual(['a', 'b', 'c']);
    c = reduce(c, { type: 'updateDecal', id: 'b', patch: { size: 1.2, opacity: 0.5 } });
    expect(c.decals[1]).toMatchObject({ id: 'b', size: 1.2, opacity: 0.5 });
    c = reduce(c, { type: 'reorderDecal', id: 'c', to: 0 });
    expect(c.decals.map((d) => d.id)).toEqual(['c', 'a', 'b']);
    c = reduce(c, { type: 'removeDecal', id: 'a' });
    expect(c.decals.map((d) => d.id)).toEqual(['c', 'b']);
  });

  it('sets and clears livery', () => {
    let c = reduce(defaultConfiguration(), { type: 'setLivery', livery: { name: 'stripes', src: 'data:image/png;base64,AAA' } });
    expect(c.livery?.name).toBe('stripes');
    c = reduce(c, { type: 'setLivery', livery: null });
    expect(c.livery).toBeNull();
  });

  it('only switches to Shots that exist, and saves new ones', () => {
    let c = defaultConfiguration();
    expect(reduce(c, { type: 'setShot', shot: 'nope' }).shot).toBe('front-three-quarter');
    c = reduce(c, { type: 'setShot', shot: 'side' });
    expect(c.shot).toBe('side');
    c = reduce(c, { type: 'saveShot', shot: { name: 'hero-low', position: [3, 0.6, -4], target: [0, 0.5, 0], fov: 28 } });
    expect(c.shots).toHaveLength(7);
    expect(c.shot).toBe('hero-low');
    // saving under an existing name replaces it
    c = reduce(c, { type: 'saveShot', shot: { name: 'hero-low', position: [1, 1, 1], target: [0, 0, 0], fov: 20 } });
    expect(c.shots.filter((s) => s.name === 'hero-low')).toHaveLength(1);
  });

  it('round-trips through JSON', () => {
    let c = defaultConfiguration();
    c = reduce(c, { type: 'setPaint', paint: 'verde-rondo' });
    c = reduce(c, { type: 'addDecal', decal: decal('a') });
    c = reduce(c, { type: 'setLivery', livery: { name: 'l', src: 'data:image/png;base64,AAA' } });
    c = reduce(c, { type: 'saveShot', shot: { name: 'x', position: [1, 2, 3], target: [0, 0, 0], fov: 25 } });
    const back = parseConfiguration(serialize(c));
    expect(back).toEqual(c);
    expect(reduce(defaultConfiguration(), { type: 'load', configuration: c })).toEqual(c);
  });

  it('parses leniently: unknown paint, missing fields, extra shot', () => {
    const back = parseConfiguration(JSON.stringify({ paint: 'zzz', shot: 'ghost', shots: [{ name: 'ghost', position: [1, 1, 1], target: [0, 0, 0], fov: 30 }] }));
    expect(back.paint).toBe('blu-toccata');
    expect(back.decals).toEqual([]);
    expect(back.livery).toBeNull();
    expect(back.shot).toBe('ghost');
    expect(back.shots).toHaveLength(7);
    expect(back.backdrop).toBe('transparent');
  });

  it('sets backdrop and aspect and keeps them through JSON', () => {
    let c = reduce(defaultConfiguration(), { type: 'setBackdrop', backdrop: 'studio' });
    c = reduce(c, { type: 'setAspect', aspect: '16:9' });
    expect(parseConfiguration(serialize(c))).toMatchObject({ backdrop: 'studio', aspect: '16:9' });
  });

  it('keeps lighting in the Configuration and clamps it', () => {
    let c = reduce(defaultConfiguration(), { type: 'setLight', light: 9 });
    expect(c.light).toBe(3);
    c = reduce(c, { type: 'setEnvPreset', envPreset: 'warehouse' });
    expect(parseConfiguration(serialize(c))).toMatchObject({ light: 3, envPreset: 'warehouse' });
    expect(parseConfiguration('{}').light).toBe(0.5);
    expect(parseConfiguration('{}').envPreset).toBe('warehouse');
  });

  it('names snapshots by paint and shot', () => {
    const c: Configuration = { ...defaultConfiguration(), paint: 'blu-toccata', shot: 'side' };
    expect(snapshotBaseName(c, 3)).toBe('blu-toccata--side--03');
  });
});
