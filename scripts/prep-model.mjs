// Ticket 00 — model prep without Blender.
// usage: node scripts/prep-model.mjs <source.glb> <out.glb>
import { NodeIO, PropertyType } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, draco, prune, textureCompress, resample } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';

const [src, out] = process.argv.slice(2);
const io = new NodeIO()
  .registerExtensions(KHRONOS_EXTENSIONS)
  .registerDependencies({
    'draco3d.encoder': await draco3d.createEncoderModule(),
    'draco3d.decoder': await draco3d.createDecoderModule(),
  });

const doc = await io.read(src);
const root = doc.getRoot();

// 1. Delete the baked shadow plane — the tool draws its own contact shadow.
for (const node of root.listNodes()) {
  const mesh = node.getMesh();
  if (mesh && mesh.getName().startsWith('Cheetah_Shadow')) {
    mesh.dispose();
    node.dispose();
  }
}

// 2. Rename materials to the glossary names.
const rename = {
  Cheetah_Body: 'Body',
  Cheetah_Glass: 'Glass',
  Cheetah_Glass_Red: 'Lights',
  Cheetah_Black: 'Interior',
  Cheetah_Plastic: 'Trim',
  Cheetah_Chrome: 'Wheel',      // rims + chrome details share this
  Cheetah_Textures: 'Detail',   // textured details, wheel faces, calipers (split below)
};
for (const mat of root.listMaterials()) {
  const n = rename[mat.getName()];
  if (n) mat.setName(n);
}

// 3. Give calipers their own material so Caliper colour is independent.
const detail = root.listMaterials().find((m) => m.getName() === 'Detail');
const caliper = detail.clone().setName('Caliper');
for (const mesh of root.listMeshes()) {
  if (!mesh.getName().startsWith('Caliper')) continue;
  for (const prim of mesh.listPrimitives()) prim.setMaterial(caliper);
}

// 4. Rename meshes/nodes to short glossary-ish names.
for (const mesh of root.listMeshes()) {
  mesh.setName(mesh.getName().replace(/_Cheetah_.*$/, ''));
}
for (const node of root.listNodes()) {
  node.setName(node.getName().replace(/_Cheetah_.*$/, ''));
}

// 5. Slim: drop unused UV sets on Body (keep TEXCOORD_0 for livery), dedup, textures to 2048, Draco.
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    for (let i = 1; i < 6; i++) {
      const a = prim.getAttribute(`TEXCOORD_${i}`);
      if (a) { prim.setAttribute(`TEXCOORD_${i}`, null); }
    }
  }
}
await doc.transform(
  // keepAttributes: Body has no texture yet, but its TEXCOORD_0 is the livery UV — do not strip it
  prune({ keepAttributes: true }),
  // never dedup materials: Caliper is a deliberate clone of Detail
  dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.TEXTURE, PropertyType.MESH] }),
  resample(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [2048, 2048] }),
  draco(),
);

await io.write(out, doc);
console.log('materials:', root.listMaterials().map((m) => m.getName()).join(', '));
console.log('meshes:', root.listMeshes().map((m) => m.getName()).join(', '));
