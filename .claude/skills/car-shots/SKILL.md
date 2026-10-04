---
name: car-shots
description: Drive the car-shots three.js tool from a browser tab. Use to render or export a Snapshot of the car (paint, livery, decals, shot, backdrop), to frame a new camera Shot, or to make a new Livery.
---

# car-shots

The app renders everything from one **Configuration** (`src/config/configuration.ts`). Use the words from `CONTEXT.md` (Paint, Livery, Shot, Snapshot, Backdrop) in what you write and name.

## Render a Snapshot

1. **Start.** Run `npm run dev` (port 5180) and, in a second background process, `node scripts/receive-render.mjs` (port 5199; it writes what you POST to `exports/`). Done when both report their port.

2. **Open** http://localhost:5180 in a browser tab and bring it to the front. Done when `window.__carShots.state()` returns an object and a screenshot shows the car. If the canvas stays empty, the tab was hidden while it loaded: run `window.dispatchEvent(new Event('resize'))` and screenshot again.

3. **Configure** with `window.__carShots.dispatch(action)`. The `Action` union in `src/config/configuration.ts` lists every action; Paint ids are in `src/config/paints.ts`; Liveries load by path, `{ type: 'setLivery', livery: { name: 'risonanza', src: '/liveries/risonanza.png' } }`. Done when `window.__carShots.config()` shows every value you asked for.

4. **Frame the Shot.** Dispatching `setShot` with a different name moves the camera there. To re-apply the current Shot after orbiting, or to try values before saving a new one, set the camera yourself:

   ```js
   const s = __carShots.state(), shot = __carShots.config().shots.find((x) => x.name === 'side');
   s.camera.position.set(...shot.position); s.camera.fov = shot.fov; s.camera.updateProjectionMatrix();
   s.controls.target.set(...shot.target); s.controls.update(); s.invalidate();
   ```

   Done when a screenshot shows the framing you expect.

5. **Render and save.** `__carShots.render()` returns a PNG data URL at export size (3:2 → 2400×1600, 16:9 → 3840×2160). POST it to the receiver:

   ```js
   await fetch('http://localhost:5199', { method: 'POST', body: JSON.stringify({ name: 'side-rosso', dataUrl: __carShots.render() }) });
   ```

   Done when `exports/<name>.png` and `.jpg` exist and you have opened the JPEG and checked it against the request: paint, livery, angle, backdrop.

## Reference

### Backdrops

`transparent` exports a cut-out with alpha and a contact shadow. `plate` puts the car in the photo `public/plates/midnight.jpg`: dispatching it also sets the matching environment, light 1.0, 16:9 and the `plate-hero` Shot, and only that Shot lines the car up with the turntable in the photo. The plate is cover-fitted to the live canvas, so give the canvas a 16:9 box before rendering a plate Snapshot, or the room crop shifts.

### Liveries

A Livery is a 4096² PNG with alpha, sampled through the Body's UVs with `flipY = false` (v = 0 at the top of the image). Where the flanks, bonnet and engine cover sit in that space is written in the header of `scripts/make-livery-crescendo.mjs`; draw from those numbers. `body-uv.png` is a guide for painting by hand. To make one in code, copy one of the `scripts/make-livery*.mjs` scripts, write to `public/liveries/<name>.png`, load it with `setLivery`, and render the `side` and `front-three-quarter` Shots to check that the graphics land on the panels you meant. On dark backdrops a Livery reads best on a bright base colour.

### Animation frames

`window.__carGen` drives the "generating" effect: a scan that turns the old look into a wireframe, then into the new Livery. Its API is in the header of `src/scene/Generating.tsx`; `scripts/receive-frames.mjs` (port 5198) saves the frames. Browsers slow timers in hidden tabs, so keep the tab visible while capturing, and pace frames with `setTimeout`.

### The car stays fictional

Paints come from `src/config/paints.ts`; decals and liveries are original artwork. Keep it that way in everything you add.
