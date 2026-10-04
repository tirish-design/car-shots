# ADR-0001 — Decals are projected, liveries are UV-mapped

**Status:** accepted, 2026-09-03

## Decision

Decals are projected onto the Body mesh (drei `Decal` / three.js `DecalGeometry`) at a clicked surface point with its normal. Liveries are full-body textures composited over the Paint through the Body mesh's UV map.

## Consequences

- The Body mesh must be UV-unwrapped in Blender before any Livery work starts. This is a blocking ticket, not a nice-to-have.
- Decals never depend on UVs, so Decal work can proceed on the raw model.
- If the unwrap cannot be done within the timebox, Livery is dropped and large Decals stand in. The Configuration shape keeps a nullable `livery` field either way.
- A Livery is painted outside the tool (any image editor, over the exported UV layout) at 4096²; the tool only loads and composites it.
