import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Box3, Mesh, MeshPhysicalMaterial, PerspectiveCamera, Vector2, Vector3 } from 'three'

// Opt-in local QA only. No sampling or DOM writes in the production build.
export function SceneDiagnostics() {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    if (!new URLSearchParams(location.search).has('aion-metrics')) return
    const canvas = gl.domElement
    // Explicit local fault-injection UI, never shipped in production.
    let faultButton: HTMLButtonElement | undefined
    if (new URLSearchParams(location.search).has('aion-fault-test')) {
      faultButton = document.createElement('button')
      faultButton.textContent = 'Test WebGL context loss'
      Object.assign(faultButton.style, { position: 'absolute', top: '16px', left: '16px', zIndex: '10', minHeight: '44px', background: '#29251b', padding: '8px' })
      faultButton.onclick = () => gl.getContext().getExtension('WEBGL_lose_context')?.loseContext()
      canvas.closest('.watch-stage')?.append(faultButton)
    }
    const originalRender = gl.render
    const intervals: number[] = []
    const submissions: number[] = []
    let previous = 0
    let frames = 0
    gl.render = function (...args: Parameters<typeof gl.render>) {
      const start = performance.now()
      const result = originalRender.apply(this, args)
      if (args[0] !== scene) return result
      const duration = performance.now() - start
      if (previous && start - previous < 100) intervals.push(start - previous)
      previous = start
      submissions.push(duration)
      if (intervals.length > 240) intervals.shift()
      if (submissions.length > 240) submissions.shift()
      const buffer = gl.getDrawingBufferSize(new Vector2())
      const rect = canvas.getBoundingClientRect()
      const model = scene.getObjectByName('AionModel')
      canvas.dataset.cameraFocus = camera.userData.focus ?? 'full'
      canvas.dataset.cameraMotion = camera.userData.transitioning ? 'moving' : 'idle'
      if (model?.userData.selection) {
        canvas.dataset.aionCase = model.userData.selection.caseFinish
        canvas.dataset.aionStrap = model.userData.selection.strap
        canvas.dataset.aionAccents = model.userData.selection.accents
      }
      let projected = null
      if (model) {
        const box = new Box3().setFromObject(model)
        const corners: Vector3[] = []
        for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new Vector3(x, y, z).project(camera))
        projected = { minX: Math.min(...corners.map(p => p.x)), maxX: Math.max(...corners.map(p => p.x)), minY: Math.min(...corners.map(p => p.y)), maxY: Math.max(...corners.map(p => p.y)) }
      }
      const stats = (values: number[]) => {
        const sorted = [...values].sort((a, b) => a - b)
        return { samples: values.length, mean: values.reduce((a, b) => a + b, 0) / (values.length || 1), p95: sorted[Math.floor((sorted.length - 1) * .95)] ?? 0, max: sorted.at(-1) ?? 0 }
      }
      const materials: Record<string, unknown> = {}
      const materialIds = new Set<string>()
      model?.traverse(object => {
        if (!(object instanceof Mesh) || Array.isArray(object.material)) return
        const m = object.material as MeshPhysicalMaterial
        materialIds.add(m.uuid)
        materials[object.name] = { id: m.uuid, type: m.type, name: m.name, color: m.color.toArray(), metalness: m.metalness, roughness: m.roughness, anisotropy: m.anisotropy, transmission: m.transmission, thickness: m.thickness, ior: m.ior, side: m.side, depthWrite: m.depthWrite, depthTest: m.depthTest, transparent: m.transparent, opacity: m.opacity, normalMap: m.normalMap?.uuid, roughnessMap: m.roughnessMap?.uuid, normalScale: m.normalScale?.toArray() }
      })
      const transforms = []
      for (let element: HTMLElement | null = canvas; element; element = element.parentElement) {
        const style = getComputedStyle(element)
        if (style.transform !== 'none' || style.filter !== 'none') transforms.push({ element: element.className, transform: style.transform, filter: style.filter })
      }
      canvas.dataset.aionMetrics = JSON.stringify({ frames: ++frames, modelRequests: performance.getEntriesByType('resource').filter(entry => entry.name.includes('/models/aion-v02.glb')).length, modelId: model?.uuid, materialCount: materialIds.size, materials, registry: model?.userData.materialRegistry, resources: { geometries: gl.info.memory.geometries, textures: gl.info.memory.textures, programs: gl.info.programs?.length }, target: camera.userData.target, focus: camera.userData.focus, transitioning: camera.userData.transitioning, zoomLimits: camera.userData.zoomLimits, deviceDpr: devicePixelRatio, rendererDpr: gl.getPixelRatio(), css: [rect.width, rect.height], buffer: [buffer.x, buffer.y], antialias: gl.getContext().getContextAttributes()?.antialias, exposure: gl.toneMappingExposure, colorSpace: gl.outputColorSpace, camera: { position: camera.position.toArray(), fov: (camera as PerspectiveCamera).fov, aspect: (camera as PerspectiveCamera).aspect }, framing: model?.userData.framing, projected, calls: gl.info.render.calls, triangles: gl.info.render.triangles, frameIntervalMs: stats(intervals), renderSubmissionMs: stats(submissions), transforms })
      return result
    }
    return () => { gl.render = originalRender; delete canvas.dataset.aionMetrics; faultButton?.remove() }
  }, [gl, scene, camera])
  return null
}
