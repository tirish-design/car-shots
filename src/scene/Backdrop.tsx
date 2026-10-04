import { MeshReflectorMaterial } from '@react-three/drei';
import { useLoader, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useConfiguration } from '../config/store';
import { PLATE_SRC, PLATE_TURNTABLE_R } from './Lighting';
import { SHOWROOM, makeConcreteTexture, makeDaylightTexture, makeOakTexture, makeTurntableTexture } from './showroom';

/** Light cyclorama, slightly cool floor. */
const HORIZON = '#e4e6e9';
const FLOOR = '#cfd3d8';

/**
 * What surrounds the car. `studio` is a light cyclorama; `showroom` is a bright gallery
 * (polished concrete, white feature wall, oak wings, daylight glazing, steel turntable) for opaque frames. `plate` is a
 * photographed room used as a fixed background image with an invisible floor that only catches the car's shadow and
 * reflection: it only lines up from the `plate-hero` shot. `transparent` mounts nothing.
 */
export function Backdrop() {
  const config = useConfiguration();
  const scene = useThree((s) => s.scene);
  const { backdrop } = config;

  useEffect(() => {
    if (backdrop === 'studio') {
      scene.background = new THREE.Color(HORIZON);
      scene.fog = new THREE.Fog(HORIZON, 10, 34);
    } else if (backdrop === 'showroom') {
      scene.background = new THREE.Color(SHOWROOM.bg);
      scene.fog = new THREE.Fog(SHOWROOM.bg, 16, 44);
    } else if (backdrop !== 'plate') {
      // `plate` owns scene.background itself; child effects run before this one, so touching it here would undo them
      scene.background = null;
      scene.fog = null;
    }
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, backdrop]);

  if (backdrop === 'studio') return <Studio />;
  if (backdrop === 'showroom') return <Showroom />;
  if (backdrop === 'plate') return <Plate />;
  return null;
}

function Studio() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow>
      <planeGeometry args={[80, 80]} />
      <MeshReflectorMaterial
        color={FLOOR}
        resolution={1024}
        mirror={0.35}
        mixBlur={1}
        mixStrength={0.8}
        blur={[500, 200]}
        roughness={0.9}
        metalness={0}
        depthScale={0.6}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.2}
        reflectorOffset={0}
      />
    </mesh>
  );
}

/** Which plate image to show behind the car. Landscape, roughly 16:9; the car sits on the turntable near the lower middle. */

/**
 * The reference render as a background plate, cover-fitted to the canvas whatever its aspect, plus a floor that is
 * mostly invisible: a translucent black disc over the plate's turntable carrying the car's reflection and, from Stage,
 * the contact shadow. No fog, no set: the plate carries the room.
 */
function Plate() {
  const scene = useThree((s) => s.scene);
  const size = useThree((s) => s.size);
  const plate = useLoader(THREE.TextureLoader, PLATE_SRC);

  useEffect(() => {
    plate.colorSpace = THREE.SRGBColorSpace;
    plate.wrapS = plate.wrapT = THREE.ClampToEdgeWrapping;
    scene.background = plate;
    return () => {
      if (scene.background === plate) scene.background = null;
    };
  }, [scene, plate]);

  // cover-fit: crop the plate rather than stretch it when the canvas aspect differs from the image
  useEffect(() => {
    const img = plate.image as { width: number; height: number } | undefined;
    if (!img) return;
    const imageAspect = img.width / img.height;
    const canvasAspect = size.width / size.height;
    if (canvasAspect < imageAspect) {
      const rx = canvasAspect / imageAspect;
      plate.repeat.set(rx, 1);
      plate.offset.set((1 - rx) / 2, 0);
    } else {
      const ry = imageAspect / canvasAspect;
      plate.repeat.set(1, ry);
      plate.offset.set(0, (1 - ry) / 2);
    }
    plate.needsUpdate = true;
  }, [plate, size.width, size.height]);

  // the reflector re-renders the scene into its own target; without this it would pick up the plate as well and add a
  // second, flipped copy of the room over the turntable. Only the car should land in the reflection.
  useEffect(() => {
    let stashed: THREE.Scene['background'] = null;
    scene.onBeforeRender = (_r, _s, _c, target) => {
      if (target && scene.background === plate) {
        stashed = scene.background;
        scene.background = null;
      }
    };
    scene.onAfterRender = () => {
      if (stashed) scene.background = stashed;
      stashed = null;
    };
    return () => {
      scene.onBeforeRender = () => {};
      scene.onAfterRender = () => {};
    };
  }, [scene, plate]);

  return (
    <group>
      {/* the plate's turntable is dark polished steel, flush with a glossy stone floor: the car's reflection is ADDED on top
          of the photo (additive, colour white, mirror 1) so the streaks already in the plate survive and only the car shows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
        <circleGeometry args={[PLATE_TURNTABLE_R + 0.6, 96]} />
        <MeshReflectorMaterial
          color="#ffffff"
          transparent
          blending={THREE.AdditiveBlending}
          opacity={0.55}
          depthWrite={false}
          envMapIntensity={0}
          /* 2048 so 2x video frames do not show blocky reflection texels (4096 thins the wireframe glow away); blur scaled 2x */
          resolution={2048}
          mirror={1}
          mixBlur={0.6}
          mixStrength={1.4}
          blur={[240, 120]}
          roughness={1}
          metalness={0}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          reflectorOffset={0}
        />
      </mesh>
      {/* a dark room: almost no fill, and the ceiling panel straight overhead as the one broad source */}
      <hemisphereLight color="#ffffff" groundColor="#1a1a1c" intensity={0.08} />
      <spotLight position={[0, 4.5, -1]} angle={0.9} penumbra={1} intensity={34} distance={12} decay={1.6} color="#fff6ea" />
    </group>
  );
}

/** An arc in my angle convention (x = cos a, z = sin a) mapped onto CylinderGeometry's thetaStart/thetaLength. */
function arc(from: number, to: number) {
  return { start: Math.PI / 2 - to, length: to - from };
}

/**
 * A bright gallery built from primitives: sunk polished concrete, a low brushed-steel turntable whose top sits at y=0
 * under the car, a curved white plaster wall facing the default camera, oak veneer wings either side with a vertical
 * light slot, daylight glazing round the rest, a pale ceiling and one black pendant spot over the car.
 */
function Showroom() {
  const concrete = useMemo(makeConcreteTexture, []);
  const oak = useMemo(makeOakTexture, []);
  const daylight = useMemo(makeDaylightTexture, []);
  const disc = useMemo(makeTurntableTexture, []);
  useEffect(() => () => { concrete.dispose(); oak.dispose(); daylight.dispose(); disc.dispose(); }, [concrete, oak, daylight, disc]);

  const F = SHOWROOM.front;
  const H = SHOWROOM.ceilingY;
  const Y = SHOWROOM.floorY;
  const T = SHOWROOM.turntable;
  const wall = arc(F - SHOWROOM.wall.half, F + SHOWROOM.wall.half);
  const wings = [arc(F - SHOWROOM.wing.to, F - SHOWROOM.wing.from), arc(F + SHOWROOM.wing.from, F + SHOWROOM.wing.to)];
  const glass = arc(F + SHOWROOM.wing.to, F - SHOWROOM.wing.to + Math.PI * 2);
  const wallH = H - Y;
  const wingH = wallH - 0.9;

  // spot targets: straight down onto the car, and a softer wash up the white wall behind it
  const carTarget = useMemo(() => new THREE.Object3D(), []);
  const wallTarget = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(Math.cos(F) * SHOWROOM.wall.radius, 1.6, Math.sin(F) * SHOWROOM.wall.radius);
    return o;
  }, [F]);
  const oakMaps = useMemo(
    () =>
      wings.map((w) => {
        const t = oak.clone();
        t.repeat.set((SHOWROOM.wing.radius * w.length) / 1.2, 1);
        t.needsUpdate = true;
        return t;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [oak],
  );

  return (
    <group>
      {/* floor: polished concrete, sunk by the turntable height */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Y, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <MeshReflectorMaterial
          map={concrete}
          color="#ffffff"
          resolution={1024}
          mirror={0.5}
          mixBlur={1}
          mixStrength={1.4}
          blur={[420, 160]}
          roughness={0.75}
          metalness={0}
          depthScale={0.8}
          minDepthThreshold={0.5}
          maxDepthThreshold={1.4}
          reflectorOffset={0}
        />
      </mesh>

      {/* turntable: a dark flush ring in the floor, a brushed rim with a bright lip, and a reflective top at y=0 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Y + 0.004, 0]}>
        <ringGeometry args={[T.radius + 0.04, T.outer, 128]} />
        <meshStandardMaterial color={SHOWROOM.steelDark} roughness={0.35} metalness={0.9} />
      </mesh>
      <mesh position={[0, Y / 2, 0]}>
        <cylinderGeometry args={[T.radius, T.radius, -Y, 128, 1, true]} />
        <meshStandardMaterial color={SHOWROOM.steel} roughness={0.3} metalness={1} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -T.rim / 2, 0]}>
        <torusGeometry args={[T.radius, T.rim, 12, 192]} />
        <meshStandardMaterial color="#d8dbde" roughness={0.25} metalness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow>
        <circleGeometry args={[T.radius - T.rim, 128]} />
        <MeshReflectorMaterial
          map={disc}
          color="#ffffff"
          resolution={1024}
          mirror={0.8}
          mixBlur={0.6}
          mixStrength={2.5}
          blur={[220, 90]}
          roughness={0.4}
          metalness={0.5}
          depthScale={1}
          minDepthThreshold={0.8}
          maxDepthThreshold={1.6}
          reflectorOffset={0}
        />
      </mesh>

      {/* feature wall: white plaster, floor to ceiling, facing the default camera, with a return either side */}
      <mesh position={[0, Y + wallH / 2, 0]}>
        <cylinderGeometry args={[SHOWROOM.wall.radius, SHOWROOM.wall.radius, wallH, 48, 1, true, wall.start, wall.length]} />
        <meshStandardMaterial color={SHOWROOM.plaster} roughness={1} side={THREE.BackSide} />
      </mesh>
      {[F - SHOWROOM.wall.half, F + SHOWROOM.wall.half].map((a) => (
        <mesh key={a} position={[Math.cos(a) * (SHOWROOM.wall.radius + 0.15), Y + wallH / 2, Math.sin(a) * (SHOWROOM.wall.radius + 0.15)]} rotation={[0, -a, 0]}>
          <boxGeometry args={[0.35, wallH, 0.12]} />
          <meshStandardMaterial color={SHOWROOM.plaster} roughness={1} />
        </mesh>
      ))}

      {/* oak wings: veneer to door-head height, white bulkhead above, one vertical light slot each */}
      {wings.map((w, i) => {
        const a = Math.PI / 2 - (w.start + w.length / 2);
        const R = SHOWROOM.wing.radius;
        return (
          <group key={i}>
            <mesh position={[0, Y + wingH / 2, 0]}>
              <cylinderGeometry args={[R, R, wingH, 32, 1, true, w.start, w.length]} />
              <meshStandardMaterial map={oakMaps[i]} roughness={0.7} side={THREE.BackSide} />
            </mesh>
            <mesh position={[0, Y + wingH + (wallH - wingH) / 2, 0]}>
              <cylinderGeometry args={[R, R, wallH - wingH, 32, 1, true, w.start, w.length]} />
              <meshStandardMaterial color={SHOWROOM.plaster} roughness={1} side={THREE.BackSide} />
            </mesh>
            <mesh position={[Math.cos(a) * (R - 0.03), 2.2, Math.sin(a) * (R - 0.03)]} rotation={[0, -a, 0]}>
              <boxGeometry args={[0.03, 2.6, 0.02]} />
              <meshBasicMaterial color={SHOWROOM.white} toneMapped={false} />
            </mesh>
            <pointLight position={[Math.cos(a) * (R - 0.5), 2.2, Math.sin(a) * (R - 0.5)]} intensity={1.2} distance={3.5} decay={2} color="#fff6e8" />
          </group>
        );
      })}

      {/* glazing: daylight beyond, slim dark mullions, a low concrete sill */}
      <mesh position={[0, Y + wallH / 2, 0]}>
        <cylinderGeometry args={[SHOWROOM.glass.radius + 1.5, SHOWROOM.glass.radius + 1.5, wallH + 2, 64, 1, true, glass.start, glass.length]} />
        <meshBasicMaterial map={daylight} side={THREE.BackSide} />
      </mesh>
      <Mullions start={glass.start} length={glass.length} height={wallH} />
      <mesh position={[0, Y + 0.25, 0]}>
        <cylinderGeometry args={[SHOWROOM.glass.radius + 0.3, SHOWROOM.glass.radius + 0.3, 0.5, 64, 1, true, glass.start, glass.length]} />
        <meshStandardMaterial color="#b9b9b6" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* ceiling: pale concrete, and the black pendant with a lit tip */}
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[SHOWROOM.glass.radius + 3, 96]} />
        <meshStandardMaterial color="#dedddb" roughness={1} />
      </mesh>
      <mesh position={[0, (H + SHOWROOM.pendant.y) / 2, 0]}>
        <cylinderGeometry args={[SHOWROOM.pendant.rod, SHOWROOM.pendant.rod, H - SHOWROOM.pendant.y, 16]} />
        <meshStandardMaterial color="#141416" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, SHOWROOM.pendant.y - 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[SHOWROOM.pendant.rod * 0.9, 16]} />
        <meshBasicMaterial color={SHOWROOM.white} toneMapped={false} />
      </mesh>

      {/* light: bright even base, the pendant pool on the car, a softer wash up the white wall, cool daylight fill */}
      <hemisphereLight color="#ffffff" groundColor="#b9b9b6" intensity={0.55} />
      <ambientLight intensity={0.25} />
      <primitive object={carTarget} />
      <spotLight position={[0, SHOWROOM.pendant.y, 0]} target={carTarget} angle={0.62} penumbra={0.7} intensity={70} distance={14} decay={1.6} color="#fffaf2" castShadow />
      <primitive object={wallTarget} />
      <spotLight position={[0, H - 0.05, 0]} target={wallTarget} angle={0.5} penumbra={0.9} intensity={45} distance={16} decay={1.4} color="#ffffff" />
      <directionalLight position={[Math.cos(F + Math.PI) * 10, 5, Math.sin(F + Math.PI) * 10]} intensity={0.6} color="#e9eef5" />
    </group>
  );
}

/** Thin dark mullions on the glazing, one every ~2.4 m of arc. */
function Mullions({ start, length, height }: { start: number; length: number; height: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const R = SHOWROOM.glass.radius;
  const count = Math.max(2, Math.round((R * length) / 2.4));
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = Math.PI / 2 - (start + (i / (count - 1)) * length);
      o.position.set(Math.cos(a) * R, SHOWROOM.floorY + height / 2, Math.sin(a) * R);
      o.rotation.set(0, -a, 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [count, start, length, height, R]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.06, height, 0.14]} />
      <meshStandardMaterial color="#2a2b2e" roughness={0.5} metalness={0.4} />
    </instancedMesh>
  );
}
