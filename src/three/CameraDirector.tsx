import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Group, Vector3 } from 'three'
import type { OrbitControls as Controls } from 'three-stdlib'
import type { SceneCommand } from './types'
import { fullDistance, protectCamera, resolveCameraPreset, type FocusId } from './cameraPresets'

type Props = {
  active: boolean; interactive: boolean; moving: boolean; command: SceneCommand
  atelier?: boolean; focus?: FocusId; focusVersion?: number; reducedMotion?: boolean
  onInteract: () => void; onMotionEnd: () => void
}
type Transition = { fromPosition: Vector3; fromTarget: Vector3; toPosition: Vector3; toTarget: Vector3; elapsed: number }
export function CameraDirector({ active, interactive, moving, command, atelier = false, focus = 'full', focusVersion = 0, reducedMotion = false, onInteract, onMotionEnd }: Props) {
  const controls = useRef<Controls>(null)
  const { invalidate, gl, scene, camera, size } = useThree()
  const fitted = useRef('')
  const transition = useRef<Transition | null>(null)
  const limits = useRef({ minDistance: 0, maxDistance: Infinity })
  const previousMode = useRef(atelier)
  const lastCommand = useRef(-1)
  const adjusting = useRef(false)
  const stop = () => {
    const orbit = controls.current
    if (transition.current && orbit) {
      limits.current.minDistance = Math.min(limits.current.minDistance, camera.position.distanceTo(orbit.target))
      orbit.minDistance = limits.current.minDistance; orbit.maxDistance = limits.current.maxDistance
    }
    transition.current = null; camera.userData.transitioning = false; onInteract()
  }
  const constrain = () => {
    if (!atelier || adjusting.current) return
    const model = scene.getObjectByName('AionModel') as Group | undefined
    const orbit = controls.current
    if (!model || !orbit) return
    adjusting.current = true
    protectCamera(camera.position, orbit.target, model.userData.framing.radius, transition.current ? 0 : limits.current.minDistance)
    camera.lookAt(orbit.target)
    adjusting.current = false
  }
  useFrame((_, delta) => {
    const model = scene.getObjectByName('AionModel') as Group | undefined
    const orbit = controls.current
    if (!model || !orbit) return
    const key = `${model.uuid}/${size.width}/${size.height}/${atelier}/${focus}/${focusVersion}`
    if (fitted.current !== key) {
      const resized = fitted.current.split('/').slice(1,3).join('/') !== [size.width,size.height].join('/')
      const modeChanged = previousMode.current !== atelier
      previousMode.current = atelier
      fitted.current = key
      const pose = resolveCameraPreset(model, atelier ? focus : 'full', size.width, size.height)
      camera.userData.fitDistance = fullDistance(model, size.width, size.height)
      limits.current = { minDistance: pose.minDistance, maxDistance: pose.maxDistance }
      orbit.minDistance = atelier ? pose.minDistance : 0
      orbit.maxDistance = atelier ? pose.maxDistance : Infinity
      if (atelier && !reducedMotion && !modeChanged && !resized) {
        transition.current = { fromPosition: camera.position.clone(), fromTarget: orbit.target.clone(), toPosition: pose.position, toTarget: pose.target, elapsed: 0 }
        camera.userData.transitioning = true
        orbit.minDistance = 0; orbit.maxDistance = Infinity
      } else {
        transition.current = null
        camera.userData.transitioning = false
        if (!atelier && !modeChanged && lastCommand.current >= 0) camera.position.setLength(pose.position.length())
        else { camera.position.copy(pose.position); orbit.target.copy(pose.target) }
        orbit.update()
      }
      camera.userData.focus = atelier ? focus : 'full'
      invalidate()
    }
    if (!active) return
    if (lastCommand.current !== command.id) {
      lastCommand.current = command.id
      if (command.action === 'reset') {
        if (!atelier) { camera.position.set(0,0,camera.userData.fitDistance ?? 12.9); orbit.target.set(0,0,0) }
      } else {
        stop()
        if (command.action === 'left' || command.action === 'right') orbit.setAzimuthalAngle(orbit.getAzimuthalAngle() + (command.action === 'left' ? -.24 : .24))
        else if (command.action === 'up' || command.action === 'down') orbit.setPolarAngle(Math.max(.4,Math.min(2.7,orbit.getPolarAngle() + (command.action === 'up' ? -.18 : .18))))
        else if (atelier) {
          camera.position.sub(orbit.target).multiplyScalar(command.action === 'zoomIn' ? .9 : 1.1).clampLength(limits.current.minDistance,limits.current.maxDistance).add(orbit.target)
        }
      }
      constrain(); orbit.update(); invalidate()
    }
    const tween = transition.current
    if (tween) {
      if (reducedMotion) tween.elapsed = .85
      else tween.elapsed += Math.min(delta, .05)
      const t = Math.min(1, tween.elapsed / .85), eased = t * t * (3 - 2 * t)
      camera.position.lerpVectors(tween.fromPosition, tween.toPosition, eased)
      orbit.target.lerpVectors(tween.fromTarget, tween.toTarget, eased)
      constrain(); orbit.update()
      if (t === 1) { transition.current = null; camera.userData.transitioning = false; orbit.minDistance = limits.current.minDistance; orbit.maxDistance = limits.current.maxDistance }
      else invalidate()
    }
    camera.userData.target = orbit.target.toArray()
    camera.userData.zoomLimits = [orbit.minDistance,orbit.maxDistance]
  }, -2)
  useEffect(() => { if (active) invalidate() }, [active, invalidate])
  useEffect(() => { invalidate() }, [atelier, focus, focusVersion, command, reducedMotion, size.width, size.height, invalidate])
  useEffect(() => {
    if (!active || !moving || atelier || reducedMotion) return
    const start = performance.now()
    let previous = start
    const timer = window.setInterval(() => {
      const now = performance.now(), orbit = controls.current
      if (orbit) { orbit.setAzimuthalAngle(orbit.getAzimuthalAngle() + (now - previous) * .00006); orbit.update() }
      previous = now; invalidate()
      if (now - start >= 8000) { clearInterval(timer); onMotionEnd() }
    }, 1000 / 30)
    return () => clearInterval(timer)
  }, [active, moving, atelier, reducedMotion, invalidate, onMotionEnd])
  useEffect(() => { gl.domElement.style.touchAction = interactive ? 'none' : 'pan-y' }, [gl, interactive])
  return <OrbitControls ref={controls} makeDefault enabled={active} enableRotate={interactive} enablePan={false} enableZoom={atelier}
    enableDamping={false} minPolarAngle={.4} maxPolarAngle={2.7} rotateSpeed={.55} zoomSpeed={.6}
    onStart={stop} onChange={() => { constrain(); invalidate() }} />
}
