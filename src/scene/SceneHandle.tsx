import { useThree, type RootState } from '@react-three/fiber';
import { useEffect, type MutableRefObject } from 'react';

/** Exposes the live R3F root state (camera, controls, renderer) to UI outside the Canvas. */
export function SceneHandle({ target }: { target: MutableRefObject<RootState | null> }) {
  const get = useThree((s) => s.get);
  // re-read when OrbitControls registers itself, which happens after this first mounts
  const controls = useThree((s) => s.controls);
  useEffect(() => {
    target.current = get();
  }, [get, target, controls]);
  return null;
}
