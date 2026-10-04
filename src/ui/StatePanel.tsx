import { serialize } from '../config/configuration';
import { useConfiguration } from '../config/store';

/** Surface the full Configuration after every action, so what changed is always visible. */
export function StatePanel() {
  const config = useConfiguration();
  const compact = { ...config, livery: config.livery ? { name: config.livery.name, src: `${config.livery.src.slice(0, 24)}…` } : null };
  return <pre className="state">{serialize(compact)}</pre>;
}
