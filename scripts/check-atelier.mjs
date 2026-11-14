import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath } from 'node:url'
import { Texture } from 'three'
import { GLTFLoader, MeshoptDecoder } from 'three-stdlib'

// Run the application's actual TypeScript modules without installing a test runner.
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && context.parentURL) {
    const url = new URL(specifier + '.ts', context.parentURL)
    if (existsSync(fileURLToPath(url))) return nextResolve(url.href, context)
  }
  return nextResolve(specifier, context)
} })
const { createAionModel } = await import('../src/three/materialRegistry.ts')
const { SCOPES, ORIGINAL } = await import('../src/three/materialVariants.ts')
const bytes = readFileSync(new URL('../public/models/aion-v02.glb', import.meta.url))
const loader = new GLTFLoader()
loader.setMeshoptDecoder(typeof MeshoptDecoder === 'function' ? MeshoptDecoder() : MeshoptDecoder)
// Node has no image decoder. Only image uploads are replaced with Texture fixtures;
// the real GLB geometry, nodes, loader material types and material links are parsed.
loader.register(() => ({ name: 'NodeTextureFixture', loadTexture: index => {
  const t = new Texture({ width: 512, height: 1024 }); t.name = 'fixture-' + index
  return Promise.resolve(t)
} }))
const gltf = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
const source = gltf.scene
const nodes = root => { const rows = []; root.traverse(o => { if (o.isMesh) rows.push(o) }); return rows }
const signature = m => ({
  type: m.type, rgb: m.color.toArray(), metalness: m.metalness, roughness: m.roughness,
  side: m.side, opacity: m.opacity, transparent: m.transparent, depthTest: m.depthTest, depthWrite: m.depthWrite,
  transmission: m.transmission, thickness: m.thickness, ior: m.ior, anisotropy: m.anisotropy,
  clearcoat: m.clearcoat, clearcoatRoughness: m.clearcoatRoughness, envMapIntensity: m.envMapIntensity,
  normalScale: m.normalScale?.toArray(), map: m.map?.uuid, normalMap: m.normalMap?.uuid,
  roughnessMap: m.roughnessMap?.uuid, metalnessMap: m.metalnessMap?.uuid, specularIntensity: m.specularIntensity,
})
const sourceBefore = nodes(source).map(n => signature(n.material))
const model = createAionModel(source)
assert.equal(model.materials.length, 13)
assert.deepEqual(model.available, { caseFinish: true, strap: true, accents: true })
const baseline = new Map(nodes(model.object).map(n => [n.name, signature(n.material)]))
const scopeNames = new Set(Object.values(SCOPES).flatMap(s => s.nodes))
const identities = nodes(model.object).map(n => [n, n.geometry, n.material, n.material.normalMap, n.material.roughnessMap])
let combinations = 0
for (const caseFinish of ['original','obsidian','graphite'])
for (const strap of ['original','noir','ash'])
for (const accents of ['original','champagne','silver']) {
  model.apply({ caseFinish, strap, accents }); combinations++
  assert.deepEqual(nodes(source).map(n => signature(n.material)), sourceBefore, 'loader cache mutated')
  for (const [mesh, geometry, material, normal, rough] of identities) {
    assert.equal(mesh.geometry, geometry); assert.equal(mesh.material, material)
    assert.equal(material.normalMap, normal); assert.equal(material.roughnessMap, rough)
    const s = signature(material), original = baseline.get(mesh.name)
    const { rgb, metalness, roughness, ...features } = s
    const { rgb: oldRgb, metalness: oldMetal, roughness: oldRough, ...oldFeatures } = original
    assert.deepEqual(features, oldFeatures, mesh.name + ' feature changed')
    if (!scopeNames.has(mesh.name)) assert.deepEqual(s, original, mesh.name + ' outside scope')
    assert.ok(!material.anisotropy, 'unsafe anisotropy')
    if (mesh.name.startsWith('Crystal_')) assert.equal(material.transmission, 1)
  }
}
for (let i = 0; i < 1000; i++) model.apply({caseFinish: i % 2 ? 'obsidian':'graphite', strap:i % 2 ? 'noir':'ash', accents:i % 2 ? 'champagne':'silver'})
model.apply(ORIGINAL); const reset = nodes(model.object).map(n => signature(n.material))
model.apply(ORIGINAL); assert.deepEqual(nodes(model.object).map(n => signature(n.material)), reset)
for (const n of nodes(model.object)) assert.deepEqual(signature(n.material), baseline.get(n.name))
const brokenSource = source.clone(true)
brokenSource.getObjectByName('Case_Midbody').name = 'UnexpectedCase'
const broken = createAionModel(brokenSource)
assert.equal(broken.available.caseFinish, false)
broken.apply({caseFinish:'graphite',strap:'ash',accents:'silver'})
assert.deepEqual(broken.object.getObjectByName('UnexpectedCase').material.color.toArray(), baseline.get('Case_Midbody').rgb)
let cachedDisposed = 0
for (const m of new Set(nodes(source).map(n => n.material))) m.addEventListener('dispose', () => cachedDisposed++)
model.materials.forEach(m => m.dispose()); broken.materials.forEach(m => m.dispose())
assert.equal(cachedDisposed, 0)
console.log(JSON.stringify({gate:'B',passed:true,parsedMeshes:nodes(source).length,ownedMaterials:model.materials.length,combinations,rapidChanges:1000,resetIdempotent:true,cacheUntouched:true,geometryAndTextureReferencesPreserved:true,missingScopeFailsClosed:true,textureUpload:'Node fixture; actual browser loading checked separately'},null,2))

const { resolveCameraPreset, projectFocusBounds, protectCamera } = await import('../src/three/cameraPresets.ts')
const { Vector3 } = await import('three')
let poses = 0, collisionSamples = 0
const cameraResults = []
for (const [width,height] of [[1000,780],[860,700],[768,420],[390,380],[320,340]]) {
  for (const focus of ['full','dial','case','strap']) {
    const preset = resolveCameraPreset(model.object, focus, width,height)
    assert.ok(preset.position.length() > preset.radius + .3)
    assert.ok(preset.position.distanceTo(preset.target) <= preset.maxDistance)
    if (focus !== 'full') {
      const projected = projectFocusBounds(model.object, focus,width,height)
      assert.ok(projected.maxX < .99 && projected.maxY < .99, focus + ' framing')
      cameraResults.push({width,height,focus,distance:preset.position.distanceTo(preset.target),...projected})
    }
    for (let a = 0; a < 24; a++) for (let p = 0; p < 12; p++) {
      const polar = .4 + p / 11 * 2.3, az = a / 24 * Math.PI * 2
      const position = new Vector3(Math.sin(polar)*Math.sin(az),Math.cos(polar),Math.sin(polar)*Math.cos(az)).multiplyScalar(preset.minDistance).add(preset.target)
      protectCamera(position,preset.target,preset.radius,preset.minDistance)
      assert.ok(position.length() >= preset.radius + .3, 'collision envelope')
      const viewDirection = position.clone().sub(preset.target).normalize()
      assert.ok(position.dot(viewDirection) - preset.radius >= .3 - 1e-8, 'near-plane clearance')
      collisionSamples++
    }
    poses++
  }
}
console.log(JSON.stringify({gate:'C',passed:true,poses,collisionSamples,cameraResults},null,2))
