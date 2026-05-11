'use client'

import { forwardRef, ButtonHTMLAttributes, CSSProperties } from 'react'
import { C, SANS, RADIUS, SPACE } from '@/app/lib/theme'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

const SIZE_STYLES: Record<Size, CSSProperties> = {
  sm: { padding: `${SPACE.xs}px ${SPACE.md}px`, fontSize: 12, minHeight: 32 },
  md: { padding: `${SPACE.sm}px ${SPACE.lg}px`, fontSize: 14, minHeight: 40 },
  lg: { padding: `${SPACE.md}px ${SPACE.xl}px`, fontSize: 15, minHeight: 48 },
}

function variantStyles(variant: Variant, disabled: boolean): CSSProperties {
  if (disabled) {
    return { background: C.warm, color: C.text3, cursor: 'not-allowed', border: `1px solid ${C.ruleLight}` }
  }
  switch (variant) {
    case 'primary':
      return { background: C.accent, color: '#fff', border: `1px solid ${C.accent}` }
    case 'secondary':
      return { background: C.warm, color: C.text, border: `1px solid ${C.rule}` }
    case 'ghost':
      return { background: 'transparent', color: C.text2, border: '1px solid transparent' }
    case 'danger':
      return { background: 'transparent', color: C.accent, border: `1px solid ${C.accent}` }
  }
}

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', fullWidth, style, disabled, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACE.sm,
        fontFamily: SANS,
        fontWeight: 600,
        borderRadius: RADIUS.md,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 150ms, color 150ms, border-color 150ms',
        width: fullWidth ? '100%' : undefined,
        ...SIZE_STYLES[size],
        ...variantStyles(variant, !!disabled),
        ...style,
      }}
      {...rest}
    />
  )
})

export default Button
