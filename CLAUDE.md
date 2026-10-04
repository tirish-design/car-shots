# car-shots

A three.js tool (React Three Fiber, leva panel) that renders a fictional car from one Configuration and exports PNG Snapshots. Vocabulary: `CONTEXT.md`. Decisions: `docs/adr/`. To drive it from a browser, use the `car-shots` skill.

- Every visual change goes through the Configuration reducer in `src/config/configuration.ts`, so a Snapshot's JSON always reproduces it. Extend the `Action` union and its test when you add a control.
- The car is fictional: paints from `src/config/paints.ts`, original decals and liveries.
- Check visual work by rendering and looking at the image; a passing build says nothing about the render.
