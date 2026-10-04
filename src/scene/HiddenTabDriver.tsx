import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

/**
 * Browsers stop requestAnimationFrame in hidden tabs, and after a few minutes throttle
 * main-thread timers to once a minute. R3F's frameloop then freezes, which breaks automated
 * screenshots and exports. While the tab is hidden, frames are driven from a Web Worker timer,
 * which is not subject to that throttling. When visible, the normal frameloop takes over.
 */
export function HiddenTabDriver() {
  const advance = useThree((s) => s.advance);
  const setFrameloop = useThree((s) => s.setFrameloop);

  useEffect(() => {
    let worker: Worker | null = null;
    const start = () => {
      if (worker) return;
      const src = 'setInterval(() => postMessage(0), 100);';
      worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      worker.onmessage = () => advance(performance.now());
    };
    const stop = () => {
      worker?.terminate();
      worker = null;
    };
    const apply = () => {
      if (document.hidden) {
        setFrameloop('never');
        start();
      } else {
        stop();
        setFrameloop('always');
      }
    };
    apply();
    document.addEventListener('visibilitychange', apply);
    return () => {
      document.removeEventListener('visibilitychange', apply);
      stop();
    };
  }, [advance, setFrameloop]);

  return null;
}
