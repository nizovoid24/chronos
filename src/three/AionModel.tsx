import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { createAionModel } from './materialRegistry'
import type { Selection } from './materialVariants'
import type { RegistryStatus } from '../atelier/AtelierControls'

export function AionModel({ onReady, onRegistry, selection }: { onReady: () => void; onRegistry: (status: RegistryStatus) => void; selection: Selection }) {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}models/aion-v02.glb`)
  const invalidate = useThree(state => state.invalidate)
  const model = useMemo(() => createAionModel(scene), [scene])
  useLayoutEffect(() => { model.apply(selection); model.object.userData.selection = selection; invalidate() }, [model, selection, invalidate])
  useEffect(() => { onRegistry({ available: model.available, errors: model.errors }) }, [model, onRegistry])
  useEffect(() => () => model.materials.forEach(material => material.dispose()), [model])
  const reported = useRef(false)
  useFrame(() => { if (!reported.current) { reported.current = true; onReady() } })
  return <primitive object={model.object} dispose={null} />
}
