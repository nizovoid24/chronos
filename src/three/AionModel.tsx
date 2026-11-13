import { useEffect, useLayoutEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { createAionModel } from './materialRegistry'
import type { Selection } from './materialVariants'
import type { RegistryStatus } from '../atelier/AtelierControls'

const modelUrl = `${import.meta.env.BASE_URL}models/aion-v02.glb`
// Reuse the HTML fetch preload and populate the existing loader cache while
// Canvas initializes. Hero and Atelier consume the same resource.
useGLTF.preload(modelUrl)

export function AionModel({ onReady, onError, onRegistry, selection }: { onReady: () => void; onError: () => void; onRegistry: (status: RegistryStatus) => void; selection: Selection }) {
  const { scene } = useGLTF(modelUrl)
  const { invalidate, gl, scene: renderedScene, camera } = useThree()
  const model = useMemo(() => createAionModel(scene), [scene])
  useLayoutEffect(() => { model.apply(selection); model.object.userData.selection = selection; invalidate() }, [model, selection, invalidate])
  useEffect(() => { onRegistry({ available: model.available, errors: model.errors }) }, [model, onRegistry])
  useEffect(() => () => model.materials.forEach(material => material.dispose()), [model])
  useLayoutEffect(() => {
    const previous = renderedScene.onAfterRender
    const context = gl.getContext()
    if (!('fenceSync' in context)) { onError(); return }
    let frame = 0
    let sync: WebGLSync | null = null
    let submitted = false
    const disposeSync = () => { if (sync) { context.deleteSync(sync); sync = null } }
    const confirmFrame = () => {
      frame = 0
      if (context.isContextLost()) { disposeSync(); onError(); return }
      const status = context.clientWaitSync(sync!, 0, 0)
      if (status === context.WAIT_FAILED) { disposeSync(); onError(); return }
      if (status === context.TIMEOUT_EXPIRED) { frame = requestAnimationFrame(confirmFrame); return }
      disposeSync()
      onReady()
    }
    const afterRender: typeof previous = function (this: typeof renderedScene, ...args) {
      previous.apply(this, args)
      // Ignore offscreen passes and frames without the fitted, lit model.
      if (submitted || args[2] !== camera || gl.getRenderTarget() !== null || !renderedScene.environment ||
        !model.object.parent || !model.object.visible || !camera.userData.fitDistance || gl.info.render.triangles === 0) return
      submitted = true
      if (context.isContextLost() || gl.info.programs?.some(program => !context.getProgramParameter(program.program, context.LINK_STATUS))) { onError(); return }
      sync = context.fenceSync(context.SYNC_GPU_COMMANDS_COMPLETE, 0)
      if (!sync) { onError(); return }
      // Confirm GPU completion without blocking the main thread or forcing more renders.
      context.flush()
      renderedScene.onAfterRender = previous
      frame = requestAnimationFrame(confirmFrame)
    }
    renderedScene.onAfterRender = afterRender
    invalidate()
    return () => {
      if (renderedScene.onAfterRender === afterRender) renderedScene.onAfterRender = previous
      cancelAnimationFrame(frame)
      disposeSync()
    }
  }, [camera, gl, invalidate, model, onReady, onError, renderedScene])
  return <primitive object={model.object} dispose={null} />
}
