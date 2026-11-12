import { FrontSide, MeshPhysicalMaterial, MeshStandardMaterial } from 'three'

// Stage 3.2 policy. Never tune a loader-owned material in place.
export function cloneHardenedMaterial(original: MeshStandardMaterial, hasTangentFrame: boolean) {
  const material = original.clone()
  material.envMapIntensity = 1.15
  if (material instanceof MeshPhysicalMaterial) {
    if (material.anisotropy > 0 && !hasTangentFrame) material.anisotropy = 0
    if (material.name === 'Crystal_Sapphire') {
      Object.assign(material, {
        roughness: .015, thickness: .012, transmission: 1, metalness: 0, ior: 1.76,
        transparent: false, opacity: 1, side: FrontSide, depthTest: true, depthWrite: true,
        specularIntensity: .12, envMapIntensity: .35,
      })
    }
  }
  return material
}
