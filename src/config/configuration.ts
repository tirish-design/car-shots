import { DEFAULT_PAINT_ID, findPaint } from './paints';
import { DEFAULT_SHOTS, DEFAULT_SHOT_NAME, type Shot } from './shots';

export type Vec3 = [number, number, number];
export type Backdrop = 'transparent' | 'studio' | 'showroom' | 'plate';
export type Aspect = '3:2' | '16:9';
export type EnvPreset = 'softbox' | 'plate' | 'studio' | 'city' | 'warehouse' | 'apartment' | 'lobby';
export const ENV_PRESETS: EnvPreset[] = ['softbox', 'plate', 'studio', 'city', 'warehouse', 'apartment', 'lobby'];
export const DEFAULT_LIGHT = 0.5;
export const ASPECTS: Record<Aspect, { ratio: number; exportWidth: number; exportHeight: number }> = {
  '3:2': { ratio: 3 / 2, exportWidth: 2400, exportHeight: 1600 },
  '16:9': { ratio: 16 / 9, exportWidth: 3840, exportHeight: 2160 },
};

export interface Decal {
  id: string;
  image: string; // file name under public/decals/
  position: Vec3;
  normal: Vec3;
  size: number;
  rotation: number; // radians around the normal
  opacity: number;
}

export interface Livery {
  name: string;
  src: string; // data URL or path under public/liveries/
}

/** The single seam of the app. Everything renders from this; export serialises it; load restores it. */
export interface Configuration {
  version: 1;
  paint: string; // Paint id
  caliper: string; // hex
  decals: Decal[];
  livery: Livery | null;
  shot: string; // Shot name
  shots: Shot[];
  backdrop: Backdrop; // transparent cut-out, the light studio cyclorama, the bright gallery showroom, or the photographed plate (fixed camera)
  aspect: Aspect; // 3:2 for cut-outs, 16:9 for full frames
  light: number; // environment intensity; 1 = raw HDRI, which blows out the roof
  envPreset: EnvPreset;
}

export const DEFAULT_CALIPER = '#C8102E';

export function defaultConfiguration(): Configuration {
  return {
    version: 1,
    paint: DEFAULT_PAINT_ID,
    caliper: DEFAULT_CALIPER,
    decals: [],
    livery: null,
    shot: DEFAULT_SHOT_NAME,
    shots: DEFAULT_SHOTS.map((s) => ({ ...s })),
    backdrop: 'transparent',
    aspect: '3:2',
    light: DEFAULT_LIGHT,
    envPreset: 'warehouse',
  };
}

export type Action =
  | { type: 'setPaint'; paint: string }
  | { type: 'setCaliper'; caliper: string }
  | { type: 'addDecal'; decal: Decal }
  | { type: 'updateDecal'; id: string; patch: Partial<Omit<Decal, 'id'>> }
  | { type: 'removeDecal'; id: string }
  | { type: 'reorderDecal'; id: string; to: number }
  | { type: 'setLivery'; livery: Livery | null }
  | { type: 'setShot'; shot: string }
  | { type: 'saveShot'; shot: Shot }
  | { type: 'setBackdrop'; backdrop: Backdrop }
  | { type: 'setAspect'; aspect: Aspect }
  | { type: 'setLight'; light: number }
  | { type: 'setEnvPreset'; envPreset: EnvPreset }
  | { type: 'load'; configuration: Configuration };

export function reduce(state: Configuration, action: Action): Configuration {
  switch (action.type) {
    case 'setPaint':
      return { ...state, paint: findPaint(action.paint).id };
    case 'setCaliper':
      return { ...state, caliper: action.caliper };
    case 'addDecal':
      return { ...state, decals: [...state.decals, action.decal] };
    case 'updateDecal':
      return { ...state, decals: state.decals.map((d) => (d.id === action.id ? { ...d, ...action.patch } : d)) };
    case 'removeDecal':
      return { ...state, decals: state.decals.filter((d) => d.id !== action.id) };
    case 'reorderDecal': {
      const from = state.decals.findIndex((d) => d.id === action.id);
      if (from < 0) return state;
      const decals = [...state.decals];
      const [d] = decals.splice(from, 1);
      const to = Math.max(0, Math.min(decals.length, action.to));
      decals.splice(to, 0, d);
      return { ...state, decals };
    }
    case 'setLivery':
      return { ...state, livery: action.livery };
    case 'setShot':
      return state.shots.some((s) => s.name === action.shot) ? { ...state, shot: action.shot } : state;
    case 'saveShot': {
      const shots = state.shots.filter((s) => s.name !== action.shot.name);
      return { ...state, shots: [...shots, { ...action.shot }], shot: action.shot.name };
    }
    case 'setBackdrop':
      // the plate is a photographed room: light the car with an environment built from that photo so the paint reflects it. Still overridable.
      if (action.backdrop === 'plate') return { ...state, backdrop: 'plate', envPreset: 'plate', light: 1.0, aspect: '16:9', shot: 'plate-hero' };
      return { ...state, backdrop: action.backdrop };
    case 'setAspect':
      return { ...state, aspect: action.aspect };
    case 'setLight':
      return { ...state, light: Math.max(0, Math.min(3, action.light)) };
    case 'setEnvPreset':
      return { ...state, envPreset: ENV_PRESETS.includes(action.envPreset) ? action.envPreset : 'warehouse' };
    case 'load':
      return parseConfiguration(JSON.stringify(action.configuration));
  }
}

export function currentShot(state: Configuration): Shot {
  return state.shots.find((s) => s.name === state.shot) ?? state.shots[0];
}

export function serialize(state: Configuration): string {
  return JSON.stringify(state, null, 2);
}

/** Parse a Configuration JSON leniently: unknown paints fall back, missing fields get defaults, defaults shots are always present. */
export function parseConfiguration(json: string): Configuration {
  const raw = JSON.parse(json) as Partial<Configuration>;
  const base = defaultConfiguration();
  const shots = [...base.shots];
  for (const s of raw.shots ?? []) {
    if (!s || typeof s.name !== 'string') continue;
    const i = shots.findIndex((x) => x.name === s.name);
    const shot: Shot = { name: s.name, position: s.position, target: s.target, fov: s.fov };
    if (i >= 0) shots[i] = shot; else shots.push(shot);
  }
  const shot = shots.some((s) => s.name === raw.shot) ? (raw.shot as string) : base.shot;
  return {
    version: 1,
    paint: findPaint(raw.paint ?? base.paint).id,
    caliper: typeof raw.caliper === 'string' ? raw.caliper : base.caliper,
    decals: Array.isArray(raw.decals) ? raw.decals.filter((d) => d && typeof d.id === 'string' && typeof d.image === 'string') : [],
    livery: raw.livery && typeof raw.livery.src === 'string' ? { name: raw.livery.name ?? 'livery', src: raw.livery.src } : null,
    shot,
    shots,
    backdrop: raw.backdrop === 'studio' || raw.backdrop === 'showroom' || raw.backdrop === 'plate' ? raw.backdrop : 'transparent',
    aspect: raw.aspect === '16:9' ? '16:9' : '3:2',
    light: typeof raw.light === 'number' && raw.light >= 0 ? Math.min(3, raw.light) : DEFAULT_LIGHT,
    envPreset: ENV_PRESETS.includes(raw.envPreset as EnvPreset) ? (raw.envPreset as EnvPreset) : 'warehouse',
  };
}

/** File base name for a Snapshot: <paint-slug>--<shot>--<NN>. */
export function snapshotBaseName(state: Configuration, n: number): string {
  return `${state.paint}--${state.shot}--${String(n).padStart(2, '0')}`;
}
