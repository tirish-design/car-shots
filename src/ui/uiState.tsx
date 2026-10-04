import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/** Tool state that is NOT part of the Configuration: what the next click does, which decal is selected, which images exist. */
export interface UiState {
  manifest: string[]; // decal image file names under public/decals/
  placingImage: string | null; // when set, clicking the Body places this image
  selectedDecalId: string | null;
  setPlacingImage: (image: string | null) => void;
  setSelectedDecalId: (id: string | null) => void;
}

const Ctx = createContext<UiState | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [manifest, setManifest] = useState<string[]>([]);
  const [placingImage, setPlacingImage] = useState<string | null>(null);
  const [selectedDecalId, setSelectedDecalId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/decals/manifest.json')
      .then((r) => r.json())
      .then((names: string[]) => setManifest(names))
      .catch(() => setManifest([]));
  }, []);

  return (
    <Ctx.Provider value={{ manifest, placingImage, selectedDecalId, setPlacingImage, setSelectedDecalId }}>{children}</Ctx.Provider>
  );
}

export function useUi(): UiState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useUi outside UiProvider');
  return v;
}
