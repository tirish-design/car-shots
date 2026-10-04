import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { defaultConfiguration, reduce, type Action, type Configuration } from './configuration';

const ConfigContext = createContext<Configuration | null>(null);
const DispatchContext = createContext<Dispatch<Action> | null>(null);

export function ConfigurationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reduce, undefined, defaultConfiguration);
  return (
    <ConfigContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </ConfigContext.Provider>
  );
}

export function useConfiguration(): Configuration {
  const c = useContext(ConfigContext);
  if (!c) throw new Error('useConfiguration outside ConfigurationProvider');
  return c;
}

export function useDispatch(): Dispatch<Action> {
  const d = useContext(DispatchContext);
  if (!d) throw new Error('useDispatch outside ConfigurationProvider');
  return d;
}
