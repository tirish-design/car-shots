import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { findPaint } from '../config/paints';
import { CAR_URL } from './Car';
import { LIVERY_SIZE } from './livery';

/**
 * The AI "generating" effect for the livery loading animation. Off unless driven from the console:
 *   window.__carGen.set({ active, s1, s2, time })   s1, s2 in 0..1 from nose to tail
 * Along the car, from the nose: the new Livery (the Configuration's) up to s2, a dark body under a glowing wireframe
 * between s2 and s1, and the old look (OLD_LIVERY over OLD_PAINT) behind s1. Each scan position carries a bright band.
 *   window.__carGen.capture(crop, w, h, renderW?, renderH?)   renders one frame (default 3840x2160), crops [x, y, w, h], returns a PNG data URL
 *   window.__carGen.setOld(src | null)    the livery behind s1; null = plain OLD_PAINT
 */
const OLD_LIVERY: string | null = '/liveries/crescendo-stripes.png';
const OLD_PAINT = 'blu-toccata';
const LAV = new THREE.Color('#B6A0F7');

interface GenState { active: boolean; s1: number; s2: number; time: number }

const zVertex = /* glsl */ `
  varying float vZ;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vZ = w.z;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;

function loadOld(src: string | null): Promise<THREE.CanvasTexture> {
  return new Promise((resolve, reject) => {
    const c = document.createElement('canvas');
    c.width = c.height = LIVERY_SIZE;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = findPaint(OLD_PAINT).hex;
    ctx.fillRect(0, 0, LIVERY_SIZE, LIVERY_SIZE);
    const done = () => {
      const t = new THREE.CanvasTexture(c);
      t.flipY = false;
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      resolve(t);
    };
    if (!src) return done();
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0, LIVERY_SIZE, LIVERY_SIZE); done(); };
    img.onerror = reject;
    img.src = src;
  });
}

export function Generating() {
  const { scene } = useGLTF(CAR_URL, true);
  const get = useThree((s) => s.get);

  useEffect(() => {
    const mats = scene.userData.carMaterials as { body: THREE.MeshPhysicalMaterial; bodyMesh: THREE.Mesh } | undefined;
    if (!mats) return;
    const { body: newMat, bodyMesh } = mats;
    const { gl } = get();
    gl.localClippingEnabled = true;

    bodyMesh.updateWorldMatrix(true, false);
    const box = new THREE.Box3().setFromObject(bodyMesh);
    const zNose = box.min.z - 0.02, zTail = box.max.z + 0.02; // nose toward -Z
    const zAt = (s: number) => zNose + (zTail - zNose) * s;

    // planes: keep nose side of s2 / tail side of s2; nose side of s1 / tail side of s1
    const noseOf2 = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    const tailOf2 = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const noseOf1 = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    const tailOf1 = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    const oldMat = newMat.clone();
    oldMat.clippingPlanes = [tailOf1];
    const setOld = (src: string | null) => loadOld(src).then((t) => {
      oldMat.map?.dispose();
      oldMat.map = t; oldMat.color.set('#ffffff'); oldMat.needsUpdate = true;
      get().invalidate();
    });
    setOld(OLD_LIVERY);

    const darkMat = new THREE.MeshPhysicalMaterial({
      color: '#0B0916', roughness: 0.3, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05,
      clippingPlanes: [tailOf2, noseOf1], polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
    });

    const uniforms = {
      uS1: { value: zTail }, uS2: { value: zNose }, uTime: { value: 0 },
      uNose: { value: zNose }, uTail: { value: zTail }, uLav: { value: LAV },
    };
    const wireMat = new THREE.ShaderMaterial({
      uniforms, wireframe: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: zVertex,
      fragmentShader: /* glsl */ `
        uniform float uS1, uS2, uTime, uNose, uTail; uniform vec3 uLav; varying float vZ;
        void main() {
          if (vZ < uS2 || vZ > uS1) discard;
          float len = uTail - uNose;
          float pulse = 0.0;
          for (int i = 0; i < 3; i++) {
            float pz = uNose + len * fract(uTime * 0.55 + float(i) / 3.0);
            pulse += exp(-pow((vZ - pz) / (len * 0.035), 2.0));
          }
          float edge = exp(-pow((vZ - uS1) / (len * 0.05), 2.0)) + exp(-pow((vZ - uS2) / (len * 0.05), 2.0));
          vec3 col = uLav * (0.55 + 1.2 * pulse + 1.5 * edge) + vec3(1.0) * (0.5 * pulse + 0.8 * edge);
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const bandMat = new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: zVertex,
      fragmentShader: /* glsl */ `
        uniform float uS1, uS2, uNose, uTail; uniform vec3 uLav; varying float vZ;
        float band(float s) {
          if (s <= uNose + 0.001 || s >= uTail - 0.001) return 0.0;
          float d = abs(vZ - s);
          return exp(-pow(d / 0.018, 2.0)) * 2.2 + exp(-pow(d / 0.09, 2.0)) * 0.7;
        }
        void main() {
          float b = band(uS1) + band(uS2);
          if (b < 0.004) discard;
          vec3 col = mix(uLav, vec3(1.0), clamp(b - 0.8, 0.0, 1.0));
          gl_FragColor = vec4(col * b, 1.0);
        }`,
    });

    const mk = (m: THREE.Material, order: number) => {
      const mesh = new THREE.Mesh(bodyMesh.geometry, m);
      mesh.renderOrder = order;
      mesh.visible = false;
      mesh.frustumCulled = false;
      bodyMesh.add(mesh);
      return mesh;
    };
    const extras = [mk(oldMat, 0), mk(darkMat, 0), mk(wireMat, 2), mk(bandMat, 3)];

    const set = ({ active, s1, s2, time }: GenState) => {
      extras.forEach((m) => (m.visible = active));
      newMat.clippingPlanes = active ? [noseOf2] : [];
      newMat.needsUpdate = true;
      const z1 = zAt(s1), z2 = zAt(Math.min(s2, s1));
      noseOf2.constant = z2; tailOf2.constant = -z2;
      noseOf1.constant = z1; tailOf1.constant = -z1;
      uniforms.uS1.value = z1; uniforms.uS2.value = z2; uniforms.uTime.value = time;
      get().invalidate();
    };

    const capture = (crop: [number, number, number, number], outW: number, outH: number, renderW = 3840, renderH = 2160) => {
      const { gl: r, scene: sc, camera } = get();
      const cam = camera as THREE.PerspectiveCamera;
      const prev = new THREE.Vector2(); r.getSize(prev);
      const prevRatio = r.getPixelRatio(), prevAspect = cam.aspect;
      try {
        r.setPixelRatio(1); r.setSize(renderW, renderH, false);
        cam.aspect = renderW / renderH; cam.updateProjectionMatrix();
        r.setClearColor(0x000000, 0); r.clear(); r.render(sc, cam);
        const c = document.createElement('canvas'); c.width = outW; c.height = outH;
        c.getContext('2d')!.drawImage(r.domElement, crop[0], crop[1], crop[2], crop[3], 0, 0, outW, outH);
        return c.toDataURL('image/png');
      } finally {
        r.setPixelRatio(prevRatio); r.setSize(prev.x, prev.y, false);
        cam.aspect = prevAspect; cam.updateProjectionMatrix(); get().invalidate();
      }
    };

    (window as unknown as { __carGen?: unknown }).__carGen = { set, capture, setOld, zNose, zTail };
    return () => {
      extras.forEach((m) => bodyMesh.remove(m));
      newMat.clippingPlanes = [];
      newMat.needsUpdate = true;
      delete (window as unknown as { __carGen?: unknown }).__carGen;
    };
  }, [scene, get]);

  return null;
}
