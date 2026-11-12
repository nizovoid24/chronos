import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

export function AdaptiveResolution() {
  const { size, setDpr, gl } = useThree()
  const previous = useRef(0)
  const samples = useRef<number[]>([])
  useEffect(() => {
    const update = () => {
      const cap = size.width < 600 || navigator.hardwareConcurrency <= 4 ? 1.5 : 2
      const pixelBudget = Math.sqrt(3_000_000 / Math.max(1, size.width * size.height))
      setDpr(Math.max(1, Math.min(devicePixelRatio || 1, cap, pixelBudget)))
      samples.current = []
      previous.current = 0
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [size.width, size.height, setDpr])
  useFrame(() => {
    const now = performance.now()
    const interval = now - previous.current
    previous.current = now
    // Ignore gaps between interactions. Only sustained slow active frames lower quality.
    if (interval > 250) { samples.current = []; return }
    samples.current.push(interval)
    if (samples.current.length < 24) return
    if (samples.current.filter(value => value > 70).length >= 8 && gl.getPixelRatio() > 1.5) setDpr(1.5)
    samples.current = []
  })
  return null
}
