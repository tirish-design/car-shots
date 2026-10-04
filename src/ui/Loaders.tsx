import { parseConfiguration } from '../config/configuration';
import { useConfiguration, useDispatch } from '../config/store';
import { useUi } from './uiState';

function readAs(file: File, as: 'text' | 'dataURL'): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    if (as === 'text') r.readAsText(file);
    else r.readAsDataURL(file);
  });
}

/** Plain file inputs: Livery PNG and Configuration JSON. leva has no file control. */
export function Loaders() {
  const dispatch = useDispatch();
  const config = useConfiguration();
  const { manifest } = useUi();
  const missing = config.decals.filter((d) => manifest.length > 0 && !manifest.includes(d.image)).map((d) => d.image);

  return (
    <div className="loaders">
      <label>
        Livery PNG (4096², alpha)
        <input
          type="file"
          accept="image/png"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            dispatch({ type: 'setLivery', livery: { name: f.name, src: await readAs(f, 'dataURL') } });
            e.target.value = '';
          }}
        />
      </label>
      {config.livery && (
        <button type="button" onClick={() => dispatch({ type: 'setLivery', livery: null })}>
          clear livery ({config.livery.name})
        </button>
      )}
      <label>
        Load Configuration JSON
        <input
          type="file"
          accept="application/json"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              dispatch({ type: 'load', configuration: parseConfiguration(await readAs(f, 'text')) });
            } catch (err) {
              console.error('[load] bad Configuration JSON', err);
            }
            e.target.value = '';
          }}
        />
      </label>
      {missing.length > 0 && <p className="warn">Missing decal images: {missing.join(', ')}</p>}
    </div>
  );
}
