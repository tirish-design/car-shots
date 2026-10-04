import { Canvas, type RootState } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { Suspense, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { ASPECTS } from '../config/configuration';
import { useConfiguration } from '../config/store';
import { Backdrop } from './Backdrop';
import { Lighting } from './Lighting';
import { Car } from './Car';
import { Generating } from './Generating';
import { HiddenTabDriver } from './HiddenTabDriver';
import { SceneHandle } from './SceneHandle';
import { ShotRig } from './ShotRig';

export function Stage({ handle, shotNonce }: { handle: MutableRefObject<RootState | null>; shotNonce: number }) {
  const config = useConfiguration();
  const ratio = ASPECTS[config.aspect].ratio;
  return (
    <div
      className="stage"
      style={{ aspectRatio: `${ratio}`, width: `min(100%, calc((100vh - 24px) * ${ratio}))` }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ alpha: true, preserveDrawingBuffer: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        camera={{ position: [5.2, 1.6, -5.6], fov: 30, near: 0.1, far: 100 }}
        style={{ background: 'transparent' }}
        onCreated={(state) => {
          handle.current = state;
        }}
      >
        <HiddenTabDriver />
        <SceneHandle target={handle} />
        <Suspense fallback={null}>
          <Lighting preset={config.envPreset} intensity={config.light} />
          <Car />
          <Generating />
        </Suspense>
        <Backdrop />
        <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={14} blur={2.2} far={2} resolution={1024} />
        <OrbitControls makeDefault target={[0, 0.55, 0]} maxPolarAngle={Math.PI / 2 - 0.02} />
        <ShotRig nonce={shotNonce} />
      </Canvas>
    </div>
  );
}
