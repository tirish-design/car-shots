import type { RootState } from '@react-three/fiber';
import { button, useControls } from 'leva';
import { useEffect, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { ENV_PRESETS, type Aspect, type Backdrop, type Decal as DecalModel, type EnvPreset } from '../config/configuration';
import { PAINTS } from '../config/paints';
import { useUi } from './uiState';
import { useConfiguration, useDispatch } from '../config/store';
import { exportSnapshot, renderSnapshotDataUrl } from '../export/snapshot';
import { readCameraAsShot } from '../scene/ShotRig';

const paintOptions = Object.fromEntries(PAINTS.map((p) => [`${p.tier} · ${p.name}`, p.id]));

export function Panel({ handle, onShotChosen }: { handle: MutableRefObject<RootState | null>; onShotChosen: () => void }) {
  const config = useConfiguration();
  const dispatch = useDispatch();
  const ui = useUi();
  // Refs so leva closures (created once) always see the latest state.
  const configRef = useRef(config);
  const imageRef = useRef('');
  const manifestRef = useRef(ui.manifest);
  manifestRef.current = ui.manifest;
  const selectedRef = useRef<DecalModel | null>(null);
  const chosenImage = () => imageRef.current || manifestRef.current[0] || null;

  const [, setPaint] = useControls('Paint', () => ({
    paint: { value: config.paint, options: paintOptions, onChange: (v: string) => dispatch({ type: 'setPaint', paint: v }) },
    caliper: { value: config.caliper, onChange: (v: string) => dispatch({ type: 'setCaliper', caliper: v }) },
  }));

  const shotOptions = Object.fromEntries(config.shots.map((s) => [s.name, s.name]));
  const [shotValues, setShot] = useControls(
    'Shot',
    () => ({
      shot: {
        value: config.shot,
        options: shotOptions,
        onChange: (v: string) => {
          dispatch({ type: 'setShot', shot: v });
          onShotChosen();
        },
      },
      newShotName: { value: '', label: 'new name' },
      'save current camera as Shot': button((get) => {
        const s = handle.current;
        const name = String(get('Shot.newShotName') ?? '').trim();
        if (!s || !name) return;
        const controls = s.controls as unknown as { target: THREE.Vector3 } | null;
        if (!controls) return;
        dispatch({ type: 'saveShot', shot: readCameraAsShot(s.camera as THREE.PerspectiveCamera, controls.target, name) });
      }),
    }),
    undefined,
    [config.shots.length],
  );
  void shotValues;

  // Decals: choose an image, arm "place on click", then click the Body. Sliders edit the selected decal.
  const selected = config.decals.find((d) => d.id === ui.selectedDecalId) ?? null;
  selectedRef.current = selected;
  const patchSelected = (patch: Partial<Pick<DecalModel, 'size' | 'rotation' | 'opacity'>>) => {
    const s = selectedRef.current;
    if (s) dispatch({ type: 'updateDecal', id: s.id, patch });
  };
  const imageOptions = Object.fromEntries(ui.manifest.map((m) => [m, m]));
  const decalOptions = Object.fromEntries(config.decals.map((d, i) => [`${i + 1} · ${d.image} (${d.id})`, d.id]));
  const [, setDecalControls] = useControls(
    'Decals',
    () => ({
      image: { value: ui.manifest[0] ?? '', options: imageOptions, onChange: (v: string) => (imageRef.current = v) },
      'place on click': { value: ui.placingImage !== null, onChange: (v: boolean) => ui.setPlacingImage(v ? chosenImage() : null) },
      selected: {
        value: ui.selectedDecalId ?? '',
        options: { '(none)': '', ...decalOptions },
        onChange: (v: string) => ui.setSelectedDecalId(v || null),
      },
      size: { value: selected?.size ?? 0.6, min: 0.05, max: 3, step: 0.01, render: () => !!selected, onChange: (v: number) => patchSelected({ size: v }) },
      rotation: { value: selected?.rotation ?? 0, min: -Math.PI, max: Math.PI, step: 0.01, render: () => !!selected, onChange: (v: number) => patchSelected({ rotation: v }) },
      opacity: { value: selected?.opacity ?? 1, min: 0, max: 1, step: 0.01, render: () => !!selected, onChange: (v: number) => patchSelected({ opacity: v }) },
      'move up': button(() => { const s = selectedRef.current; if (s) dispatch({ type: 'reorderDecal', id: s.id, to: Math.max(0, configRef.current.decals.findIndex((d) => d.id === s.id) - 1) }); }, { disabled: !selected }),
      'move down': button(() => { const s = selectedRef.current; if (s) dispatch({ type: 'reorderDecal', id: s.id, to: configRef.current.decals.findIndex((d) => d.id === s.id) + 1 }); }, { disabled: !selected }),
      'remove decal': button(() => { const s = selectedRef.current; if (s) { dispatch({ type: 'removeDecal', id: s.id }); ui.setSelectedDecalId(null); } }, { disabled: !selected }),
    }),
    undefined,
    [ui.manifest, config.decals.map((d) => d.id).join(','), ui.selectedDecalId],
  );
  useEffect(() => { setDecalControls({ 'place on click': ui.placingImage !== null }); }, [ui.placingImage, setDecalControls]);
  useEffect(() => { if (selected) setDecalControls({ size: selected.size, rotation: selected.rotation, opacity: selected.opacity }); }, [selected?.id, setDecalControls]); // eslint-disable-line react-hooks/exhaustive-deps

  const [, setStage] = useControls('Stage', () => ({
    backdrop: { value: config.backdrop, options: { 'transparent (cut-out)': 'transparent', 'studio (light cyclorama)': 'studio', 'showroom (gallery)': 'showroom', 'plate (image, use plate shot)': 'plate' }, onChange: (v: Backdrop) => dispatch({ type: 'setBackdrop', backdrop: v }) },
    aspect: { value: config.aspect, options: { '3:2': '3:2', '16:9': '16:9' }, onChange: (v: Aspect) => dispatch({ type: 'setAspect', aspect: v }) },
    light: { value: config.light, min: 0.05, max: 2, step: 0.01, onChange: (v: number) => dispatch({ type: 'setLight', light: v }) },
    environment: { value: config.envPreset, options: Object.fromEntries(ENV_PRESETS.map((p) => [p, p])), onChange: (v: EnvPreset) => dispatch({ type: 'setEnvPreset', envPreset: v }) },
  }));
  useEffect(() => { setStage({ backdrop: config.backdrop, aspect: config.aspect, light: config.light, environment: config.envPreset }); }, [config.backdrop, config.aspect, config.light, config.envPreset, setStage]);

  useControls('Snapshot', () => ({
    'export PNG + JSON': button(() => {
      const s = handle.current;
      if (!s) return;
      exportSnapshot(s, configRef.current).then((base) => console.log('[snapshot] exported', base));
    }),
  }));

  configRef.current = config;

  // Automated checks can render an export without triggering a download.
  useEffect(() => {
    (window as unknown as { __carShots?: unknown }).__carShots = {
      render: () => (handle.current ? renderSnapshotDataUrl(handle.current, configRef.current.aspect) : null),
      config: () => configRef.current,
      dispatch,
      ui,
      state: () => handle.current,
    };
  }, [handle, dispatch, ui]);

  // Keep leva in sync when the Configuration changes from elsewhere (load, saveShot).
  useEffect(() => { setPaint({ paint: config.paint, caliper: config.caliper }); }, [config.paint, config.caliper, setPaint]);
  useEffect(() => { setShot({ shot: config.shot }); }, [config.shot, setShot]);

  return null;
}
