# CONTEXT.md — car-shots glossary

Ubiquitous language for this repo. Use these words in code, tickets, the leva panel and file names. Words in the "avoid" list are not synonyms; they are banned.

## Terms

- **Configuration** — the complete state of one render: Paint, Caliper colour, Decals, Livery and Shot. Serialisable to JSON and restorable from it. The single seam of the app.
- **Paint** — one entry from the fictional marque catalogue: name (Italian colour + musical term), tier (Base / Virtuosa / Sinfonica), hex and Finish. Hero paint is Blu Toccata.
- **Finish** — how a Paint reflects light: `solid`, `metallic` or `matte`. Maps to roughness / metalness / clearcoat values. No flake layer.
- **Caliper colour** — a plain colour on the caliper material. Independent of Paint.
- **Decal** — one image projected onto the Body mesh at a surface point: image id, position, normal, size, rotation, opacity. Never depends on UVs.
- **Livery** — one full-body PNG with alpha, mapped through the Body mesh's UVs and composited over the Paint so the Paint shows through transparent areas. At most one per Configuration.
- **Shot** — a named camera: position, target, field of view. Rendered at a fixed 3:2 aspect. The defaults: `front-three-quarter`, `side`, `rear-three-quarter`, `flank-detail`, `low-hero`, `plate-hero`.
- **Snapshot** — one Configuration rendered through one Shot, exported as a transparent PNG (with contact shadow) plus the Configuration JSON under the same base name.
- **Backdrop** — what surrounds the car in a Snapshot: `transparent` (cut-out for compositing), `studio` (a light cyclorama with a blurred reflective floor), `showroom` (a bright gallery: polished concrete, white feature wall, steel turntable) or `plate` (a photo of a room, lined up with the `plate-hero` Shot).
- **Aspect** — the Snapshot frame: `3:2` for cut-outs, `16:9` for a whole frame.
- **Body** — the mesh + material that receives Paint, Decals and Livery. Named `Body` in the GLB.

## Avoid

- "wrap", "skin" → **Livery**
- "preset" → **Shot** (for cameras) or **Paint** (for colours)
- "material", "scene", "settings" as user-facing words → name the domain object instead
- "render" as a noun → **Snapshot**
