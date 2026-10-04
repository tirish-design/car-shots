export interface Shot {
  name: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

/** Car is Y-up on y=0, nose toward -Z, ~5.4 m long. Rendered at a fixed 3:2 aspect. */
export const DEFAULT_SHOTS: Shot[] = [
  { name: 'front-three-quarter', position: [5.2, 1.6, -5.6], target: [0, 0.55, 0], fov: 30 },
  { name: 'side', position: [8.2, 1.1, 0], target: [0, 0.6, 0], fov: 30 },
  { name: 'rear-three-quarter', position: [-5.9, 1.8, 6.3], target: [0.1, 0.55, 0.2], fov: 30 },
  { name: 'flank-detail', position: [4.4, 1.0, -0.6], target: [0.6, 0.65, 0.3], fov: 26 },
  // Front-left three-quarter, low, framed for 16:9
  { name: 'low-hero', position: [-4.9, 1.05, -5.0], target: [0.35, 0.42, 0.15], fov: 33 },
  // Lines the car up on the turntable of the plate (public/plates/midnight.jpg), derived from its ellipse with a level
  // camera (verticals are vertical): 2.12 turntable radii out, 0.37 radii above the floor, vertical fov ~66; r = 3.3 m
  { name: 'plate-hero', position: [4.58, 1.21, -5.29], target: [0, 1.21, 0], fov: 66 },
];

export const DEFAULT_SHOT_NAME = DEFAULT_SHOTS[0].name;
