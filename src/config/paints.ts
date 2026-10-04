export type Finish = 'solid' | 'metallic' | 'matte';
export type Tier = 'Base' | 'Virtuosa' | 'Sinfonica';

export interface Paint {
  id: string; // slug, e.g. "blu-toccata"
  name: string;
  tier: Tier;
  hex: string;
  finish: Finish;
}

const p = (name: string, tier: Tier, hex: string, finish: Finish): Paint => ({
  id: name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-'),
  name,
  tier,
  hex,
  finish,
});

/** The fictional marque catalogue: Italian colour + musical term. Tiers escalate musically. */
export const PAINTS: Paint[] = [
  // Base offer
  p('Arancio Vivace', 'Base', '#F26A1B', 'solid'),
  p('Bianco Cadenza', 'Base', '#F2F0EA', 'solid'),
  p('Bianco Cantabile', 'Base', '#E9E6DC', 'solid'),
  p('Blu Notturno', 'Base', '#0F1F3D', 'solid'),
  p('Blu Preludio', 'Base', '#2B4C8C', 'solid'),
  p('Verde Scherzo', 'Base', '#3E7A3A', 'solid'),
  // Virtuosa
  p('Arancio Presto', 'Virtuosa', '#FF6A00', 'metallic'),
  p('Bianco Brillante', 'Virtuosa', '#F7F7F2', 'metallic'),
  p('Blu Toccata', 'Virtuosa', '#1F3E77', 'metallic'),
  p('Giallo Allegro', 'Virtuosa', '#F5C400', 'metallic'),
  p('Grigio Sospiro', 'Virtuosa', '#6E7378', 'metallic'),
  p('Verde Rondò', 'Virtuosa', '#2E8B57', 'metallic'),
  p('Viola Sonata', 'Virtuosa', '#5A2E8C', 'metallic'),
  // Sinfonica
  p('Arancio Crescendo', 'Sinfonica', '#E8571E', 'matte'),
  p('Bianco Lirico', 'Sinfonica', '#F1EFE6', 'matte'),
  p('Blu Rapsodia', 'Sinfonica', '#123A6B', 'matte'),
  p('Blu Adagio', 'Sinfonica', '#4A6FA5', 'matte'),
  p('Bronzo Barocco', 'Sinfonica', '#7A5230', 'metallic'),
  p('Grigio Maestoso', 'Sinfonica', '#4B4F55', 'matte'),
  p('Rosso Fortissimo', 'Sinfonica', '#B4121B', 'metallic'),
  p('Verde Pastorale', 'Sinfonica', '#6B8E23', 'matte'),
];

export const DEFAULT_PAINT_ID = 'blu-toccata';

export function findPaint(id: string): Paint {
  return PAINTS.find((x) => x.id === id) ?? PAINTS.find((x) => x.id === DEFAULT_PAINT_ID)!;
}

/** Physical-material parameters per Finish. */
export const FINISH_PARAMS: Record<Finish, { roughness: number; metalness: number; clearcoat: number; clearcoatRoughness: number }> = {
  solid: { roughness: 0.35, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.03 },
  metallic: { roughness: 0.3, metalness: 0.9, clearcoat: 1, clearcoatRoughness: 0.03 },
  matte: { roughness: 0.8, metalness: 0.1, clearcoat: 0, clearcoatRoughness: 0.5 },
};
