import { useEffect, useState } from 'react'

export function useDelayedUnmount(open, delay = 180) {
  const [mounted, setMounted] = useState(open)
  useEffect(() => {
    if (open) { setMounted(true); return }
    const timer = setTimeout(() => setMounted(false), delay)
    return () => clearTimeout(timer)
  }, [open, delay])
  return mounted
}

export function useClickOutside(ref, callback, active) {
  useEffect(() => {
    if (!active) return
    const handle = (event) => {
      if (ref.current && !ref.current.contains(event.target)) callback()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [active, callback, ref])
}
