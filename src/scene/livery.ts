import { useEffect, useState } from 'react';
import * as THREE from 'three';
import type { Livery } from '../config/configuration';

export const LIVERY_SIZE = 4096;

/**
 * Composite the Livery PNG over the Paint colour into one CanvasTexture mapped through the Body UVs.
 * The Paint shows through transparent areas, so one livery file works on every Paint.
 * Returns null when there is no Livery.
 */
export function useLiveryTexture(livery: Livery | null, paintHex: string): THREE.CanvasTexture | null {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    if (!livery) {
      setTexture(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      canvas.width = LIVERY_SIZE;
      canvas.height = LIVERY_SIZE;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = paintHex;
      ctx.fillRect(0, 0, LIVERY_SIZE, LIVERY_SIZE);
      ctx.drawImage(img, 0, 0, LIVERY_SIZE, LIVERY_SIZE);
      const tex = new THREE.CanvasTexture(canvas);
      tex.flipY = false; // glTF UV convention; matches body-uv.png orientation
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      console.log('[livery] composited', livery.name, img.width, img.height);
      setTexture((prev) => {
        prev?.dispose();
        return tex;
      });
    };
    img.onerror = () => console.error('[livery] could not load', livery.name);
    img.src = livery.src;
    return () => {
      cancelled = true;
    };
  }, [livery, paintHex]);

  return texture;
}
