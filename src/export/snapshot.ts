import type { RootState } from '@react-three/fiber';
import * as THREE from 'three';
import { ASPECTS, serialize, snapshotBaseName, type Aspect, type Configuration } from '../config/configuration';

let counter = 0;

function download(name: string, blob: Blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

/**
 * Render the current Configuration through the current camera at export size and download PNG + JSON.
 * The renderer's own canvas is used (preserveDrawingBuffer is on), resized for one frame and restored.
 */
export async function exportSnapshot(state: RootState, config: Configuration): Promise<string> {
  const { gl, scene, camera } = state;
  const { exportWidth: EXPORT_WIDTH, exportHeight: EXPORT_HEIGHT } = ASPECTS[config.aspect];
  const canvas = gl.domElement;
  const prevSize = new THREE.Vector2();
  gl.getSize(prevSize);
  const prevPixelRatio = gl.getPixelRatio();
  const cam = camera as THREE.PerspectiveCamera;
  const prevAspect = cam.aspect;

  try {
    gl.setPixelRatio(1);
    gl.setSize(EXPORT_WIDTH, EXPORT_HEIGHT, false);
    cam.aspect = EXPORT_WIDTH / EXPORT_HEIGHT;
    cam.updateProjectionMatrix();
    gl.setClearColor(0x000000, 0);
    gl.clear();
    gl.render(scene, cam);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
    if (!blob) throw new Error('toBlob failed');
    counter += 1;
    const base = snapshotBaseName(config, counter);
    download(`${base}.png`, blob);
    download(`${base}.json`, new Blob([serialize(config)], { type: 'application/json' }));
    return base;
  } finally {
    gl.setPixelRatio(prevPixelRatio);
    gl.setSize(prevSize.x, prevSize.y, false);
    cam.aspect = prevAspect;
    cam.updateProjectionMatrix();
    state.invalidate();
  }
}

/** Same render, returned as a data URL (used by automated checks). */
export function renderSnapshotDataUrl(state: RootState, aspect: Aspect = '3:2'): string {
  const { gl, scene, camera } = state;
  const { exportWidth: EXPORT_WIDTH, exportHeight: EXPORT_HEIGHT } = ASPECTS[aspect];
  const prevSize = new THREE.Vector2();
  gl.getSize(prevSize);
  const prevPixelRatio = gl.getPixelRatio();
  const cam = camera as THREE.PerspectiveCamera;
  const prevAspect = cam.aspect;
  try {
    gl.setPixelRatio(1);
    gl.setSize(EXPORT_WIDTH, EXPORT_HEIGHT, false);
    cam.aspect = EXPORT_WIDTH / EXPORT_HEIGHT;
    cam.updateProjectionMatrix();
    gl.setClearColor(0x000000, 0);
    gl.clear();
    gl.render(scene, cam);
    return gl.domElement.toDataURL('image/png');
  } finally {
    gl.setPixelRatio(prevPixelRatio);
    gl.setSize(prevSize.x, prevSize.y, false);
    cam.aspect = prevAspect;
    cam.updateProjectionMatrix();
    state.invalidate();
  }
}
