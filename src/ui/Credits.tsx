const REPO = 'https://github.com/tirish-design/car-shots';

/** Source, docs and the attribution the CC BY model requires. */
export function Credits() {
  return (
    <footer className="credits">
      <p>
        <a href={REPO}>README and Claude Code skill on GitHub</a>
      </p>
      <p>
        Car: <a href="https://sketchfab.com/3d-models/generic-supercar-3485cef88f3d4725ab038ddd70a78557">Generic Supercar</a> by Mona x
        Supercars, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Modified for this tool: shadow plane removed, materials renamed, mesh and textures compressed.
      </p>
      <p>
        Environment: <a href="https://polyhaven.com/a/empty_warehouse_01">Empty Warehouse 01</a>, Poly Haven, CC0. Room plate generated with
        Google's Nano Banana. Built with Claude Code.
      </p>
    </footer>
  );
}
