// Gi  t  Hub  @Sta  r s ailsClover
export type GlassVariant = 'regular' | 'prominent';
export type GlassSize = 'small' | 'medium' | 'large';

export function normalizeVariant(value: string | null): GlassVariant {
  return value === 'prominent' ? 'prominent' : 'regular';
}

export function normalizeSize(value: string | null): GlassSize {
  return value === 'small' || value === 'large' ? value : 'medium';
}
