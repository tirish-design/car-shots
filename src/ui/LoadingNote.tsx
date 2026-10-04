import { useProgress } from '@react-three/drei';

/** First visit downloads the car and the lighting (about 2.3 MB); say so instead of showing an empty stage. */
export function LoadingNote() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return <p className="loading-note">Loading the car and the lighting… {Math.round(progress)}%</p>;
}
