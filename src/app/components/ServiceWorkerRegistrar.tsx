'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    // Register the SW — it handles offline caching and timer notifications.
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => { /* ignore */ })
  }, [])
  return null
}
