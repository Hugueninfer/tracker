import type { LabelTint } from '@/lib/types'

// soft pastel chip backgrounds per design.json
export const labelTintClass: Record<LabelTint, string> = {
  yellow: 'bg-tint-yellow text-ink',
  coral: 'bg-tint-coral text-white',
  sage: 'bg-tint-sage text-white',
  cream: 'bg-tint-cream text-ink',
  accent: 'bg-accent-tint text-ink',
}

export const LABEL_TINTS: LabelTint[] = ['accent', 'yellow', 'coral', 'sage', 'cream']
