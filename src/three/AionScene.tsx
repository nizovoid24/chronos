import { memo, Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import type { SceneCommand } from './types'
import { SceneDiagnostics } from './SceneDiagnostics'
import { AdaptiveResolution } from './AdaptiveResolution'
import { AionModel } from './AionModel'
import { CameraDirector } from './CameraDirector'
import type { Selection } from './materialVariants'
import type { FocusId } from './cameraPresets'
import type { RegistryStatus } from '../atelier/AtelierControls'

type Props = {
  active: boolean; interactive: boolean; moving: boolean; command: SceneCommand
  atelier: boolean; selection: Selection; focus: FocusId; focusVersion: number; reducedMotion: boolean
  onRegistry: (status: RegistryStatus) => void
  onReady: () => void; onError: () => void; onInteract: () => void; onMotionEnd: () => void
}
const cameraPosition: [number, number, number] = [0, 0, 12.9]

// Capture the studio once. Parent viewer state must not recapture the cubemap.
const StudioEnvironment = memo(function StudioEnvironment() {
  return <Environment resolution={128} frames={1}>
    <color attach="background" args={[0.16, 0.17, 0.19]} />
    <Lightformer form="rect" intensity={5} position={[-4, 3, 5]} scale={[3, 8, 1]} target={[0, 0, 0]} />
    <Lightformer form="rect" intensity={2.5} position={[5, 1, 3]} scale={[2, 7, 1]} target={[0, 0, 0]} />
    <Lightformer form="rect" intensity={3} color="#f5dfb5" position={[0, 5, 2]} scale={[6, 2, 1]} target={[0, 0, 0]} />
    <Lightformer form="rect" intensity={0.8} position={[0, 1, 6]} scale={[5, 6, 1]} target={[0, 0, 0]} />
    <Lightformer form="rect" intensity={2} color="#fff5e5" position={[-2, -4, 4]} scale={[3, 2, 1]} target={[0, 0, 0]} />
    <Lightformer form="rect" intensity={3} position={[-2, 1, -5]} scale={[2, 7, 1]} target={[0, 0, 0]} />
  </Environment>
})

function ContextGuard({ onError }: { onError: () => void }) {
  const { gl } = useThree()
  useEffect(() => {
    const canvas = gl.domElement
    const lost = (event: Event) => { event.preventDefault(); onError() }
    canvas.addEventListener('webglcontextlost', lost)
    return () => canvas.removeEventListener('webglcontextlost', lost)
  }, [gl, onError])
  return null
}

export default function AionScene(props: Props) {
  const mobile = matchMedia('(max-width: 767px)').matches
  return <Canvas camera={{ position: cameraPosition, fov: 31, near: 0.1, far: 60 }} frameloop="demand"
    dpr={[1, mobile || navigator.hardwareConcurrency <= 4 ? 1.5 : 2]} gl={{ antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: false }}
    style={{ pointerEvents: props.interactive ? 'auto' : 'none' }}
    onCreated={({ gl }) => { gl.toneMapping = ACESFilmicToneMapping; gl.toneMappingExposure = 1; gl.outputColorSpace = SRGBColorSpace }}
    // Canvas renders fallback as HTML canvas children even when WebGL works.
    // Keep it inert; SceneBoundary handles renderer errors and ContextGuard handles context loss.
    fallback={null}>
    <ContextGuard onError={props.onError} />
    <AdaptiveResolution />
    {import.meta.env.DEV && <SceneDiagnostics />}
    <ambientLight intensity={0.35} />
    <directionalLight position={[3, 5, 7]} intensity={2.2} color="#fff5df" />
    <Suspense fallback={null}>
      <StudioEnvironment />
      <AionModel onReady={props.onReady} onError={props.onError} onRegistry={props.onRegistry} selection={props.selection} />
    </Suspense>
    <CameraDirector {...props} />
  </Canvas>
}
