import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { currentShot } from '../config/configuration';
import { useConfiguration } from '../config/store';
import type { Shot } from '../config/shots';

/** Snaps the camera to the current Shot whenever it changes (name or nonce). Free orbit remains available afterwards. */
export function ShotRig({ nonce }: { nonce: number }) {
  const config = useConfiguration();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3; update: () => void } | null;
  const invalidate = useThree((s) => s.invalidate);
  const shot = currentShot(config);

  useEffect(() => {
    if (!controls) return;
    camera.position.set(...shot.position);
    controls.target.set(...shot.target);
    camera.fov = shot.fov;
    camera.updateProjectionMatrix();
    controls.update();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shot.name, nonce, controls]);

  return null;
}

/** Read the live camera as a Shot (used by "save as Shot"). */
export function readCameraAsShot(camera: THREE.PerspectiveCamera, target: THREE.Vector3, name: string): Shot {
  return {
    name,
    position: [camera.position.x, camera.position.y, camera.position.z].map((v) => +v.toFixed(3)) as Shot['position'],
    target: [target.x, target.y, target.z].map((v) => +v.toFixed(3)) as Shot['target'],
    fov: camera.fov,
  };
}
