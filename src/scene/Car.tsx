import { useGLTF } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { FINISH_PARAMS, findPaint } from '../config/paints';
import { useConfiguration, useDispatch } from '../config/store';
import { useUi } from '../ui/uiState';
import { Decals } from './Decals';
import { useLiveryTexture } from './livery';

export const CAR_URL = '/models/car.glb';

interface CarMaterials {
  body: THREE.MeshPhysicalMaterial;
  caliper: THREE.MeshStandardMaterial;
  bodyMesh: THREE.Mesh;
}

/** Walk the GLB once, swap the Body material for a physical paint material, and detach the caliper texture so it takes a flat colour. */
function prepare(scene: THREE.Group): CarMaterials {
  // Idempotent: useGLTF caches the scene, and StrictMode/remounts call this again.
  const cached = scene.userData.carMaterials as CarMaterials | undefined;
  if (cached) return cached;
  let bodyMesh: THREE.Mesh | null = null;
  let caliper: THREE.MeshStandardMaterial | null = null;
  // Overall light level lives in the Configuration (scene.environmentIntensity); the body carries no extra boost.
  const body = new THREE.MeshPhysicalMaterial({ name: 'Body', envMapIntensity: 1 });

  scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.castShadow = true;
    const mat = o.material as THREE.Material;
    if (mat.name === 'Body') {
      o.material = body;
      bodyMesh = o;
    } else if (mat.name === 'Caliper') {
      if (!caliper) {
        caliper = (mat as THREE.MeshStandardMaterial).clone();
        caliper.map = null;
        caliper.metalness = 0.4;
        caliper.roughness = 0.45;
        caliper.needsUpdate = true;
      }
      o.material = caliper;
    }
  });
  if (!bodyMesh || !caliper) throw new Error('car.glb is missing the Body or Caliper material');
  const result: CarMaterials = { body, caliper, bodyMesh };
  scene.userData.carMaterials = result;
  return result;
}

let decalCounter = 0;

export function Car() {
  const { scene } = useGLTF(CAR_URL, true);
  const mats = useMemo(() => prepare(scene), [scene]);
  const config = useConfiguration();
  const dispatch = useDispatch();
  const { placingImage, setPlacingImage, setSelectedDecalId } = useUi();
  const paint = findPaint(config.paint);
  const liveryTexture = useLiveryTexture(config.livery, paint.hex);

  // Paint (+ Livery composited over it)
  useEffect(() => {
    const f = FINISH_PARAMS[paint.finish];
    mats.body.map = liveryTexture;
    mats.body.color.set(liveryTexture ? '#ffffff' : paint.hex);
    mats.body.roughness = f.roughness;
    mats.body.metalness = f.metalness;
    mats.body.clearcoat = f.clearcoat;
    mats.body.clearcoatRoughness = f.clearcoatRoughness;
    mats.body.needsUpdate = true;
  }, [mats, paint, liveryTexture]);

  // Caliper colour
  useEffect(() => {
    mats.caliper.color.set(config.caliper);
  }, [mats, config.caliper]);

  // Click on the Body to place the chosen decal at the hit point.
  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!placingImage || e.object !== mats.bodyMesh || !e.face) return;
      e.stopPropagation();
      const local = mats.bodyMesh.worldToLocal(e.point.clone());
      const n = e.face.normal; // already in the Body's local space
      const id = `d${Date.now().toString(36)}${(decalCounter += 1)}`;
      dispatch({
        type: 'addDecal',
        decal: {
          id,
          image: placingImage,
          position: [local.x, local.y, local.z].map((v) => +v.toFixed(4)) as [number, number, number],
          normal: [n.x, n.y, n.z].map((v) => +v.toFixed(4)) as [number, number, number],
          size: 0.6,
          rotation: Math.PI / 2, // drei's default orientation puts the image's X axis vertical; start horizontal

          opacity: 1,
        },
      });
      setSelectedDecalId(id);
      setPlacingImage(null);
    },
    [placingImage, mats.bodyMesh, dispatch, setSelectedDecalId, setPlacingImage],
  );

  return (
    <>
      <primitive object={scene} onPointerDown={onPointerDown} />
      <Suspense fallback={null}>
        <Decals bodyMesh={mats.bodyMesh} />
      </Suspense>
    </>
  );
}

useGLTF.preload(CAR_URL, true);
