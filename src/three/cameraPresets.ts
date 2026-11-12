import { Box3, Group, Mesh, PerspectiveCamera, Vector3 } from 'three'

export type FocusId = 'full' | 'dial' | 'case' | 'strap'
export const FOCUS_LABELS: Record<FocusId, string> = { full: 'Full Watch', dial: 'Dial Detail', case: 'Case & Crown', strap: 'Leather Strap' }
const targets: Record<Exclude<FocusId, 'full'>, string[]> = {
  dial: ['Dial_Static_AccentChampagneGold', 'Dial_Static_DialGraphite', 'Dial_Static_MovementBrushedBrass', 'Dial_Static_MovementRuthenium', 'Hands_Hour', 'Hands_Minute', 'Hands_Seconds', 'Crystal_Front'],
  case: ['Case_Midbody', 'Case_FacetedBezel', 'Crown_KnurledBody', 'Crown_Static_AccentChampagneGold', 'Crown_Static_CaseDarkSteel', 'Crown_Static_SteelPolishedEdge'],
  strap: ['Strap_UpperLeather'],
}
const boundsCache = new WeakMap<Group, Map<FocusId, Box3>>()
export function focusBounds(model: Group, focus: Exclude<FocusId, 'full'>) {
  let cache = boundsCache.get(model)
  if (!cache) { cache = new Map(); boundsCache.set(model, cache) }
  if (cache.has(focus)) return cache.get(focus)!.clone()
  const box = new Box3(), point = new Vector3()
  model.updateMatrixWorld(true)
  for (const name of targets[focus]) {
    const node = model.getObjectByName(name)
    if (!(node instanceof Mesh)) throw new Error('Missing focus node: ' + name)
    const positions = node.geometry.getAttribute('position')
    for (let i = 0; i < positions.count; i++) box.expandByPoint(point.fromBufferAttribute(positions, i).applyMatrix4(node.matrixWorld))
  }
  cache.set(focus, box)
  return box.clone()
}
export function fullDistance(model: Group, width: number, height: number) {
  const { radius, horizontalRadius } = model.userData.framing as { radius: number; horizontalRadius: number }
  const halfFov = 31 * Math.PI / 360
  return Math.max(12.9, radius * 1.04 / Math.sin(halfFov), (radius + horizontalRadius / (Math.tan(halfFov) * width / height)) * 1.04)
}
// A sphere containing every model vertex is a conservative collision envelope.
// Keeping the camera outside radius + margin also protects its near plane.
export function protectCamera(position: Vector3, target: Vector3, radius: number, minimum = 0) {
  const direction = position.clone().sub(target)
  if (direction.lengthSq() < 1e-10) direction.set(0, 0, 1)
  direction.normalize()
  const marginRadius = radius + .3
  const dot = target.dot(direction)
  const discriminant = dot * dot + marginRadius * marginRadius - target.lengthSq()
  const exit = discriminant > 0 ? -dot + Math.sqrt(discriminant) : 0
  // Also keep the entire envelope in front of the near plane when orbiting
  // an off-centre target; Euclidean camera clearance alone is insufficient.
  const planeClearance = marginRadius - dot
  const distance = Math.max(position.distanceTo(target), minimum, exit + .015, planeClearance + .015)
  position.copy(target).addScaledVector(direction, distance)
}
export function resolveCameraPreset(model: Group, focus: FocusId, width: number, height: number) {
  const radius = model.userData.framing.radius as number
  if (focus === 'full') {
    const distance = fullDistance(model, width, height)
    return { target: new Vector3(), position: new Vector3(0, 0, distance), minDistance: distance, maxDistance: Math.min(45, distance * 1.9), radius }
  }
  const box = focusBounds(model, focus)
  const target = box.getCenter(new Vector3())
  const direction = (focus === 'case' ? new Vector3(.55, .2, 1) : focus === 'strap' ? new Vector3(.1, .2, 1) : new Vector3(0, 0, 1)).normalize()
  const right = new Vector3().crossVectors(new Vector3(0, 1, 0), direction).normalize()
  const up = new Vector3().crossVectors(direction, right).normalize()
  const tanV = Math.tan(31 * Math.PI / 360), tanH = tanV * width / height
  let distance = 0
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    const p = new Vector3(x, y, z).sub(target)
    distance = Math.max(distance, p.dot(direction) + Math.max(Math.abs(p.dot(right)) / (tanH * .86), Math.abs(p.dot(up)) / (tanV * .86)))
  }
  const position = target.clone().addScaledVector(direction, distance)
  protectCamera(position, target, radius)
  distance = position.distanceTo(target)
  return { target, position, minDistance: distance * .84, maxDistance: Math.min(40, distance * 2.1), radius }
}
export function projectFocusBounds(model: Group, focus: Exclude<FocusId, 'full'>, width: number, height: number) {
  const preset = resolveCameraPreset(model, focus, width, height)
  const camera = new PerspectiveCamera(31, width / height, .1, 60)
  camera.position.copy(preset.position); camera.lookAt(preset.target); camera.updateMatrixWorld()
  const b = focusBounds(model, focus)
  let maxX = 0, maxY = 0
  for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
    const p = new Vector3(x,y,z).project(camera)
    maxX = Math.max(maxX, Math.abs(p.x)); maxY = Math.max(maxY, Math.abs(p.y))
  }
  return { maxX, maxY }
}
