import type { ReactNode } from 'react'
import { cx } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  tint?: 'white' | 'yellow' | 'coral' | 'sage' | 'cream' | 'ink'
}

const tintBg: Record<NonNullable<CardProps['tint']>, string> = {
  white: 'bg-card',
  yellow: 'bg-tint-yellow',
  coral: 'bg-tint-coral text-white',
  sage: 'bg-tint-sage text-white',
  cream: 'bg-tint-cream',
  ink: 'bg-tint-ink text-white',
}

/** Base surface — design.json card anatomy: big radius, soft shadow, generous padding, no hard border. */
export function Card({ children, className, tint = 'white' }: CardProps) {
  return (
    <div
      className={cx(
        'rounded-card shadow-card p-card',
        tintBg[tint],
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  action?: ReactNode
  className?: string
}

/** Consistent card header: bold dark title + discreet right-aligned action ("View Details"). */
export function CardHeader({ title, action, className }: CardHeaderProps) {
  return (
    <div className={cx('flex items-center justify-between mb-4', className)}>
      <h2 className="text-cardTitle font-bold">{title}</h2>
      {action && <div className="text-meta text-muted">{action}</div>}
    </div>
  )
}
