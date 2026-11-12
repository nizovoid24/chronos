import { useReducer } from 'react'
import { ORIGINAL, type Selection, type MaterialGroup } from '../three/materialVariants'
import type { FocusId } from '../three/cameraPresets'
type State = { open: boolean; selection: Selection; focus: FocusId; version: number }
type Action = { type: 'open' } | { type: 'close' } | { type: 'reset' } | { type: 'focus'; focus: FocusId } | { type: 'select'; group: MaterialGroup; value: string }
export function atelierReducer(state: State, action: Action): State {
  if (action.type === 'open') return { ...state, open: true, focus: 'full', version: state.version + 1 }
  if (action.type === 'close') return { ...state, open: false, focus: 'full', version: state.version + 1 }
  if (action.type === 'reset') return { ...state, selection: { ...ORIGINAL }, focus: 'full', version: state.version + 1 }
  if (action.type === 'focus') return { ...state, focus: action.focus, version: state.version + 1 }
  const allowed = { caseFinish: ['original','obsidian','graphite'], strap: ['original','noir','ash'], accents: ['original','champagne','silver'] }
  return allowed[action.group].includes(action.value) ? { ...state, selection: { ...state.selection, [action.group]: action.value } } : state
}
export function useAtelierState() {
  return useReducer(atelierReducer, { open: false, selection: { ...ORIGINAL }, focus: 'full', version: 0 })
}
