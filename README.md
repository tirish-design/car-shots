# car-shots

A small three.js tool that renders one fictional car the same way every time: pick a paint, add decals or a full livery, choose a camera, export a PNG.

## Why it exists

I needed the same car in a lot of images, from the same angles, in different colours. Image generators couldn't hold the car's shape from one picture to the next: the doors moved, the wheels changed, the roofline drifted. A 3D model doesn't drift. So I built this with Claude Code in a few days, and kept using it for the animations too.

## What it does

Everything on screen comes from one **Configuration**, a JSON object you can export and load back:

- **Paint**: 21 fictional colours (an Italian colour and a musical term, like Blu Toccata) in three finishes: solid, metallic, matte.
- **Caliper colour**, set on its own.
- **Decals**: images projected onto the body where you click. Size, rotation, opacity, order.
- **Livery**: a full-body 4096² PNG with alpha, mapped through the body's UVs, with the paint showing through the transparent parts. 15 examples in `public/liveries/`.
- **Shot**: a named camera. Six built in, and you can save the current view as a new one.
- **Backdrop**: transparent (a cut-out with a contact shadow), a light studio, a gallery showroom, or a photo plate the car sits in.
- **Export**: PNG at 2400×1600 (3:2) or 3840×2160 (16:9), plus the Configuration JSON with the same name.

The words above are the tool's vocabulary. `CONTEXT.md` defines each one.

## Run it

It runs locally in a desktop browser.

```sh
npm install
npm run dev        # http://localhost:5180
npm test           # Configuration reducer and JSON round-trip
```

## Make your own livery

Paint over the UV layout in `public/models/body-uv.png` at 4096², keep the background transparent, and load the PNG from the side panel. The `scripts/make-livery-*.mjs` files draw liveries in code instead. Their headers note where the flanks, bonnet and engine cover sit in UV space, which is the hard part.

## Use it with Claude Code

`.claude/skills/car-shots/SKILL.md` teaches Claude Code to drive the tool: start it, set a Configuration from the browser console, frame a Shot, render, and save the files to `exports/`. Open the repo in Claude Code and ask for what you want, for example "render the car in Rosso Fortissimo with the risonanza livery from the side, 16:9".

The skill drives a real browser tab, so it needs a browser tool connected to Claude Code (Claude in Chrome works).

## How it was built

The tool was planned with [Matt Pocock's skills](https://github.com/mattpocock/skills) for Claude Code: a grilling session to pin the scope, a domain glossary (`CONTEXT.md`), one decision record (`docs/adr/`), a spec, then small tickets built one at a time. Claude Code wrote most of the code; I directed it, checked every render, and made the visual calls.

## Credits

- Car: [Generic Supercar](https://sketchfab.com/3d-models/generic-supercar-3485cef88f3d4725ab038ddd70a78557) by Mona x Supercars, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Modified here: shadow plane removed, materials renamed, calipers split out, mesh and textures compressed (`scripts/prep-model.mjs`).
- Lighting: [Empty Warehouse 01](https://polyhaven.com/a/empty_warehouse_01) from Poly Haven, CC0.
- The room plate (`public/plates/midnight.jpg`) was generated with Google's Nano Banana.
- Code: MIT, see `LICENSE`. The licences above apply to their assets.
