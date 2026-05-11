'use client'

import { useEffect, useRef, ReactNode, CSSProperties } from 'react'
import { BACKDROP, C, RADIUS, SPACE } from '@/app/lib/theme'

type Props = {
  open: boolean
  onClose: () => void
  // aria-labelledby — element id holding the title text
  labelId?: string
  children: ReactNode
  width?: number | string
  // Container style override — for special cases (custom padding, no background, etc)
  containerStyle?: CSSProperties
  closeOnBackdrop?: boolean
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export default function Modal({
  open,
  onClose,
  labelId,
  children,
  width,
  containerStyle,
  closeOnBackdrop = true,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    openerRef.current = (document.activeElement as HTMLElement) || null

    const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const nodes = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
        if (nodes.length === 0) return
        const firstEl = nodes[0]
        const lastEl = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }

    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const opener = openerRef.current
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      opener?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={closeOnBackdrop ? onClose : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: BACKDROP,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACE.lg,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: width ?? 'min(440px, 92vw)',
          maxHeight: '90vh',
          overflow: 'auto',
          background: C.bg,
          border: `1px solid ${C.rule}`,
          borderRadius: RADIUS.lg,
          ...containerStyle,
        }}
      >
        {children}
      </div>
    </div>
  )
}
