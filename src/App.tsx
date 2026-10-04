import type { RootState } from '@react-three/fiber';
import { Leva } from 'leva';
import { useCallback, useRef, useState } from 'react';
import { ConfigurationProvider } from './config/store';
import { Stage } from './scene/Stage';
import { Loaders } from './ui/Loaders';
import { Panel } from './ui/Panel';
import { StatePanel } from './ui/StatePanel';
import { Credits } from './ui/Credits';
import { UiProvider } from './ui/uiState';

export function App() {
  const handle = useRef<RootState | null>(null);
  const [shotNonce, setShotNonce] = useState(0);
  const onShotChosen = useCallback(() => setShotNonce((n) => n + 1), []);

  return (
    <ConfigurationProvider>
      <UiProvider>
        <div className="app">
          <div className="stage-wrap">
            <Stage handle={handle} shotNonce={shotNonce} />
          </div>
          <aside className="side">
            <div className="leva-host">
              <Leva fill flat titleBar={false} />
            </div>
            <Panel handle={handle} onShotChosen={onShotChosen} />
            <Loaders />
            <StatePanel />
            <Credits />
          </aside>
        </div>
      </UiProvider>
    </ConfigurationProvider>
  );
}
