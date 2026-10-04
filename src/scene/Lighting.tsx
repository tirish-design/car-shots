import { Environment, Lightformer } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { EnvPreset } from '../config/configuration';
import { DEFAULT_SHOTS } from '../config/shots';

/** The photographed room used by the `plate` backdrop; the `plate` environment is built from the same image. */
export const PLATE_SRC = '/plates/midnight.jpg';
/** Radius of the plate's turntable in metres: the scale the `plate-hero` shot was derived at. */
export const PLATE_TURNTABLE_R = 3.3;
/** Where the horizon sits in the plate, as a fraction down the image (0.5 = level camera). */
const PLATE_HORIZON = 0.5;

/**
 * Lighting for the car. `softbox` is a hand-built studio rig:
 * one wide overhead softbox, a key and a rim strip, a low ground bounce, and a light-grey ambient so
 * body lines on the roof and bonnet stay readable (no single hot light that whites them out).
 * The other presets are drei's HDRIs for comparison.
 *
 * The showroom Backdrop does not add its fixtures here: drei's Environment portal (preset + children) rendered a black
 * cubemap in this app, so the paint keeps the plain HDRI and the fixtures show in the floor reflection only.
 */
export function Lighting({ preset, intensity }: { preset: EnvPreset; intensity: number }) {
  if (preset === 'plate') return <PlateEnvironment intensity={intensity} />;
  if (preset !== 'softbox') {
    // warehouse (the default) is vendored so the tool does not depend on drei's GitHub CDN; the rest still stream.
    return preset === 'warehouse' ? (
      <Environment files="/hdri/empty_warehouse_01_1k.hdr" environmentIntensity={intensity} />
    ) : (
      <Environment preset={preset} environmentIntensity={intensity} />
    );
  }
  return (
    <Environment resolution={512} environmentIntensity={intensity} frames={1}>
      {/* ambient base: light cool grey, like a cyclorama */}
      <color attach="background" args={['#9ea3a9']} />
      {/* overhead softbox: wide, long, moderate — reads as one long graduated highlight along the roof */}
      <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[0, 5.5, 0]} rotation-x={Math.PI / 2} scale={[14, 5, 1]} />
      {/* key from front-left, high: shapes the bonnet and the front wing */}
      <Lightformer form="rect" intensity={1.2} color="#f4f6ff" position={[-7, 4, -5]} target={[0, 0.6, 0]} scale={[5, 3, 1]} />
      {/* rim from rear-right: separates the tail and the flank from the backdrop */}
      <Lightformer form="rect" intensity={0.9} color="#ffffff" position={[7, 3, 6]} target={[0, 0.6, 0]} scale={[4, 2.5, 1]} />
      {/* side fill, low and wide: sill and door detail */}
      <Lightformer form="rect" intensity={0.5} color="#eef1f5" position={[8, 1.2, -1]} target={[0, 0.5, 0]} scale={[8, 2, 1]} />
      {/* ground bounce: the bright floor lights the underside */}
      <Lightformer form="rect" intensity={0.35} color="#dfe3e8" position={[0, -2, 0]} rotation-x={-Math.PI / 2} scale={[20, 20, 1]} />
      {/* soft ring far behind the camera for gentle wraparound */}
      <Lightformer form="ring" intensity={0.25} color="#ffffff" position={[0, 3, -14]} target={[0, 0.5, 0]} scale={[10, 10, 1]} />
      <mesh scale={100}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#b9bec4" side={THREE.BackSide} />
      </mesh>
    </Environment>
  );
}

/**
 * An environment built for the midnight plate: a near-black room, the photo wrapped onto the far side of a cylinder
 * (the side the `plate-hero` camera looks at) so the paint carries the back wall's light lines, one broad warm ceiling
 * panel overhead, and thin diagonal light strips on every wall, including behind the camera where the photo cannot
 * help, so the side of the car facing the camera is drawn by crisp highlight lines. Not photometrically exact.
 */
function PlateEnvironment({ intensity }: { intensity: number }) {
  const source = useLoader(THREE.TextureLoader, PLATE_SRC);
  // own copy: the Backdrop uses the same image as scene.background with cover-fit repeat/offset
  const plate = useMemo(() => {
    const t = source.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    // seen from inside the cylinder the arc runs right-to-left, so mirror the image back
    t.repeat.set(-1, 1);
    t.offset.set(1, 0);
    t.needsUpdate = true;
    return t;
  }, [source]);
  useEffect(() => () => plate.dispose(), [plate]);

  // face the wrapped photo the way the plate camera looks, so what the camera sees behind the car is also what the car reflects
  const shot = DEFAULT_SHOTS.find((s) => s.name === 'plate-hero') ?? DEFAULT_SHOTS[0];
  const dx = shot.target[0] - shot.position[0];
  const dz = shot.target[2] - shot.position[2];
  const yaw = Math.atan2(dx, dz);

  const img = source.image as { width: number; height: number };
  const R = 10; // cylinder radius: roughly the back wall's distance behind the turntable
  const ARC = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(shot.fov) / 2) * (img.width / img.height)); // the photo's horizontal fov
  const width = R * ARC;
  const height = width * (img.height / img.width); // keep the photo's aspect on the arc
  const centreY = shot.position[1] + height * (0.5 - PLATE_HORIZON); // the horizon of the photo sits at the camera height

  // local frame (group rotated by yaw): +z runs away from the camera, the camera stands on -z, image-left is +x
  const W = 6.8; // side walls, measured off the plate
  const strips: { p: [number, number, number]; ry: number; tilt: number; len: number }[] = [
    // side walls, leaning like the lines in the photo
    ...[-6, 0, 6].flatMap((z) => [
      { p: [W, 2.3, z] as [number, number, number], ry: -Math.PI / 2, tilt: 0.6, len: 4.6 },
      { p: [-W, 2.3, z] as [number, number, number], ry: Math.PI / 2, tilt: -0.6, len: 4.6 },
    ]),
    // back wall
    { p: [-3, 2.2, 9], ry: Math.PI, tilt: 0.5, len: 4 },
    { p: [0.5, 2.2, 9], ry: Math.PI, tilt: -0.55, len: 4 },
    { p: [3.5, 2.2, 9], ry: Math.PI, tilt: 0.5, len: 4 },
    // the wall behind the camera: the photo never shows it, but it is what the camera-facing flank reflects
    { p: [-4, 2.2, -12], ry: 0, tilt: -0.55, len: 4.5 },
    { p: [0, 2.2, -12], ry: 0, tilt: 0.5, len: 4.5 },
    { p: [4, 2.2, -12], ry: 0, tilt: -0.5, len: 4.5 },
  ];

  return (
    <Environment resolution={1024} environmentIntensity={intensity} frames={1}>
      <group rotation-y={yaw}>
        {/* the room: near-black all round, with the photo on the arc the camera sees */}
        <mesh>
          <cylinderGeometry args={[R + 4, R + 4, 40, 48, 1, true]} />
          <meshBasicMaterial color="#0b0b0c" side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, centreY, 0]}>
          <cylinderGeometry args={[R, R, height, 64, 1, true, -ARC / 2, ARC]} />
          <meshBasicMaterial map={plate} side={THREE.BackSide} toneMapped={false} />
        </mesh>
        {strips.map((s, i) => (
          <Lightformer key={i} form="rect" intensity={7} color="#ffffff" position={s.p} rotation={[0, s.ry, s.tilt]} scale={[0.06, s.len, 1]} />
        ))}
        {/* the ceiling light panel: broad and warm, over the turntable and reaching toward the camera */}
        <Lightformer form="rect" intensity={2.2} color="#fff6ea" position={[0, 4.95, -2.5]} rotation-x={Math.PI / 2} scale={[5, 7, 1]} />
      </group>
      {/* floor: dark honed stone, the steel turntable a shade lighter; ceiling dark */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial color="#1c1c1e" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]}>
        <circleGeometry args={[PLATE_TURNTABLE_R, 48]} />
        <meshBasicMaterial color="#2a2a2d" />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 5, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial color="#131314" />
      </mesh>
    </Environment>
  );
}
