import { Decal, useTexture } from '@react-three/drei';
import { createPortal } from '@react-three/fiber';
import * as THREE from 'three';
import type { Decal as DecalModel } from '../config/configuration';
import { useConfiguration } from '../config/store';
import { useUi } from '../ui/uiState';

function OneDecal({ decal, selected }: { decal: DecalModel; selected: boolean }) {
  const map = useTexture(`/decals/${decal.image}`);
  map.colorSpace = THREE.SRGBColorSpace;
  // Keep the image's aspect: size is the decal's width along the image's X axis.
  const img = map.image as { width?: number; height?: number } | undefined;
  const aspect = img?.width && img?.height ? img.width / img.height : 1;
  return (
    <Decal position={decal.position} rotation={decal.rotation} scale={[decal.size, decal.size / aspect, decal.size]}>
      <meshStandardMaterial
        map={map}
        transparent
        opacity={decal.opacity}
        polygonOffset
        polygonOffsetFactor={-10}
        depthTest
        depthWrite={false}
        roughness={0.4}
        metalness={0}
        emissive={selected ? '#B6A0F7' : '#000000'}
        emissiveIntensity={selected ? 0.25 : 0}
        toneMapped={false}
      />
    </Decal>
  );
}

/** Projects every Decal in the Configuration onto the Body mesh (ADR-0001: decals never depend on UVs). */
export function Decals({ bodyMesh }: { bodyMesh: THREE.Mesh }) {
  const config = useConfiguration();
  const { manifest, selectedDecalId } = useUi();
  const known = new Set(manifest);
  return createPortal(
    <>
      {config.decals
        .filter((d) => known.has(d.image))
        .map((d) => (
          <OneDecal key={d.id} decal={d} selected={d.id === selectedDecalId} />
        ))}
    </>,
    bodyMesh,
  );
}
