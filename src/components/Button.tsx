import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '@/lib/utils'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dark'
  children: ReactNode
}

const styles = {
  primary:
    'bg-accent text-white shadow-card hover:scale-[1.02] hover:shadow-cardHover',
  secondary:
    'bg-card text-ink border border-hairline hover:bg-accent-tint hover:border-transparent',
  dark: 'bg-tint-ink text-white hover:scale-[1.02]',
}

/** Pill CTA per design.json — soft motion via scale, never hard borders for primary. */
export function Button({ variant = 'primary', className, children, ...rest }: Props) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-pill px-5 h-11 text-item font-semibold transition-all duration-200 ease-soft',
        styles[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
