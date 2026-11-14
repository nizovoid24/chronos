import { readFile, writeFile } from 'node:fs/promises'
import { Box3, Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { MeshoptDecoder } from 'three-stdlib'

// Independently project the actual shipped GLB vertices through an orbit sweep.
const bytes = await readFile('public/models/aion-v02.glb')
const jsonLength = bytes.readUInt32LE(12)
const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength))
let binary = bytes.subarray(28 + jsonLength)
const decoder = typeof MeshoptDecoder === 'function' ? MeshoptDecoder() : MeshoptDecoder
await decoder.ready
const decodedViews = gltf.bufferViews.map(view => {
  const compression = view.extensions?.EXT_meshopt_compression
  if (!compression) return binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)
  const decoded = new Uint8Array(compression.count * compression.byteStride)
  decoder.decodeGltfBuffer(decoded, compression.count, compression.byteStride,
    binary.subarray(compression.byteOffset ?? 0, (compression.byteOffset ?? 0) + compression.byteLength), compression.mode, compression.filter)
  return Buffer.from(decoded)
})
let decodedOffset = 0
gltf.bufferViews.forEach((view, index) => { view.byteOffset = decodedOffset; decodedOffset += decodedViews[index].length })
binary = Buffer.concat(decodedViews)
const points = []
const envelope = new Box3()
const orientation = new Matrix4().makeRotationX(Math.PI / 2)
for (const node of gltf.nodes) {
  if (node.mesh == null) continue
  const transform = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(new Vector3(...(node.translation ?? [0, 0, 0])), new Quaternion(...(node.rotation ?? [0, 0, 0, 1])), new Vector3(...(node.scale ?? [1, 1, 1])))
  transform.premultiply(orientation)
  for (const primitive of gltf.meshes[node.mesh].primitives) {
    const accessor = gltf.accessors[primitive.attributes.POSITION]
    const view = gltf.bufferViews[accessor.bufferView]
    const offset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
    envelope.union(new Box3(new Vector3(...accessor.min), new Vector3(...accessor.max)).applyMatrix4(transform))
    for (let index = 0; index < accessor.count; index++) {
      const base = offset + index * (view.byteStride ?? 12)
      points.push(new Vector3(binary.readFloatLE(base), binary.readFloatLE(base + 4), binary.readFloatLE(base + 8)).applyMatrix4(transform))
    }
  }
}
const center = envelope.getCenter(new Vector3())
const scale = 6 / envelope.getSize(new Vector3()).y
const rotation = new Quaternion().setFromEuler(new Euler(.09, -.2, -.24))
for (const point of points) point.sub(center).multiplyScalar(scale).applyQuaternion(rotation)
const radius = points.reduce((r, p) => Math.max(r, p.length()), 0)
const horizontalRadius = points.reduce((r, p) => Math.max(r, Math.hypot(p.x, p.z)), 0)
const halfFov = 31 * Math.PI / 360
const results = []
for (const [width, height] of [[819.2, 651], [390, 525], [320, 525], [672.4, 581]]) {
  const aspect = width / height
  const distance = Math.max(12.9, radius * 1.04 / Math.sin(halfFov), (radius + horizontalRadius / (Math.tan(halfFov) * aspect)) * 1.04)
  let maximumX = 0, maximumY = 0
  for (let a = 0; a < 24; a++) for (let p = 0; p <= 10; p++) {
    const azimuth = a * Math.PI / 12, polar = .4 + p * (2.7 - .4) / 10
    const sa = Math.sin(azimuth), ca = Math.cos(azimuth), sp = Math.sin(polar), cp = Math.cos(polar)
    for (const point of points) {
      const depth = distance - (sp * sa * point.x + cp * point.y + sp * ca * point.z)
      maximumX = Math.max(maximumX, Math.abs(ca * point.x - sa * point.z) / (depth * Math.tan(halfFov) * aspect))
      maximumY = Math.max(maximumY, Math.abs(-cp * sa * point.x + sp * point.y - cp * ca * point.z) / (depth * Math.tan(halfFov)))
    }
  }
  results.push({ css: [width, height], distance, maximumX, maximumY, passed: maximumX < 1 && maximumY < 1, orbitSamples: 264 })
}
const projectedHeight = (height, distance, fov) => {
  let minimum = Infinity, maximum = -Infinity
  for (const point of points) {
    const y = point.y / ((distance - point.z) * Math.tan(fov * Math.PI / 360))
    minimum = Math.min(minimum, y); maximum = Math.max(maximum, y)
  }
  return (maximum - minimum) * height / 2
}
const beforeHeight = projectedHeight(470, 12.8, 32)
const afterHeight = projectedHeight(651, 12.9, 31)
const output = { vertices: points.length, radius, horizontalRadius, fov: 31, comparison: { beforeCssHeight: beforeHeight, afterCssHeight: afterHeight, scale: afterHeight / beforeHeight }, results }
await writeFile('reports/stage33/framing-check.json', JSON.stringify(output, null, 2))
console.log(JSON.stringify(output, null, 2))
if (results.some(result => !result.passed)) process.exitCode = 1
