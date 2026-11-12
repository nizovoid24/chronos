import { Box3, Group, LinearSRGBColorSpace, Mesh, MeshStandardMaterial, Vector3 } from 'three'
import { cloneHardenedMaterial } from './materialPolicy'
import { ACCENT_PBR, CASE_PBR, SCOPES, STRAP_PBR, type Scope, type Selection } from './materialVariants'

export function createAionModel(source: Group) {
  const clone = source.clone(true)
  const owned = new Map<string, MeshStandardMaterial>()
  clone.traverse(object => {
    if (!(object instanceof Mesh)) return
    const hasBasis = object.geometry.hasAttribute('tangent') || object.geometry.hasAttribute('uv')
    const tune = (original: MeshStandardMaterial) => {
      const key = `${original.uuid}/${hasBasis}`
      if (!owned.has(key)) owned.set(key, cloneHardenedMaterial(original, hasBasis))
      return owned.get(key)!
    }
    object.material = Array.isArray(object.material) ? object.material.map(tune) : tune(object.material)
  })
  const oriented = new Group()
  oriented.add(clone)
  oriented.rotation.x = Math.PI / 2
  oriented.updateMatrixWorld(true)
  const box = new Box3().setFromObject(oriented)
  const center = box.getCenter(new Vector3())
  const size = box.getSize(new Vector3())
  const normalized = new Group()
  normalized.name = 'AionModel'
  oriented.position.sub(center)
  normalized.add(oriented)
  normalized.scale.setScalar(6 / size.y)
  normalized.rotation.set(.09, -.2, -.24)
  normalized.updateMatrixWorld(true)
  let radius = 0, horizontalRadius = 0
  const point = new Vector3()
  normalized.traverse(object => {
    if (!(object instanceof Mesh)) return
    const positions = object.geometry.getAttribute('position')
    for (let index = 0; index < positions.count; index++) {
      point.fromBufferAttribute(positions, index).applyMatrix4(object.matrixWorld)
      radius = Math.max(radius, point.length())
      horizontalRadius = Math.max(horizontalRadius, Math.hypot(point.x, point.z))
    }
  })
  normalized.userData.framing = { radius, horizontalRadius }

  const available = { caseFinish: true, strap: true, accents: true }
  const errors: string[] = []
  const scoped = new Map<Scope, MeshStandardMaterial>()
  for (const [scope, spec] of Object.entries(SCOPES) as [Scope, typeof SCOPES[Scope]][]) {
    const nodes = spec.nodes.map(name => {
      const matches: Mesh[] = []
      normalized.traverse(o => { if (o.name === name && o instanceof Mesh) matches.push(o) })
      return matches.length === 1 ? matches[0] : undefined
    })
    if (nodes.some(o => !o || Array.isArray(o.material) || !(o.material instanceof MeshStandardMaterial) || o.material.name !== spec.material)) {
      available[spec.category] = false
      errors.push(`Unverified ${scope} material scope`)
      continue
    }
    const meshes = nodes as Mesh<import('three').BufferGeometry, MeshStandardMaterial>[]
    // Split only the two materials shared with unrelated nodes. Other groups already own their scope.
    const material = scope === 'case' || scope === 'backRing' ? meshes[0].material.clone() : meshes[0].material
    if (scope === 'case' || scope === 'backRing') owned.set(scope, material)
    meshes.forEach(mesh => { mesh.material = material })
    scoped.set(scope, material)
  }
  const materials = [...owned.values()]
  const snapshots = new Map(materials.map(m => [m, { color: m.color.clone(), metalness: m.metalness, roughness: m.roughness }]))
  const restore = () => snapshots.forEach((s, m) => { m.color.copy(s.color); m.metalness = s.metalness; m.roughness = s.roughness })
  const set = (scope: Scope, pbr: { rgb: [number, number, number]; roughness?: number; metalness?: number }) => {
    const m = scoped.get(scope)
    if (!m) return
    m.color.setRGB(...pbr.rgb, LinearSRGBColorSpace)
    if (pbr.roughness !== undefined) m.roughness = pbr.roughness
    if (pbr.metalness !== undefined) m.metalness = pbr.metalness
  }
  const apply = (selection: Selection) => {
    restore()
    if (available.caseFinish && selection.caseFinish !== 'original') {
      set('case', CASE_PBR[selection.caseFinish]); set('backRing', CASE_PBR[selection.caseFinish])
    }
    if (available.strap && selection.strap !== 'original') set('leather', STRAP_PBR[selection.strap])
    if (available.accents && selection.accents !== 'original') {
      set('gold', ACCENT_PBR[selection.accents].gold); set('brass', ACCENT_PBR[selection.accents].brass)
    }
  }
  normalized.userData.materialRegistry = { available, errors, count: materials.length }
  return { object: normalized, materials, available, errors, apply, restore }
}
