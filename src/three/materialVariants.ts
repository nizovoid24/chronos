export type CaseFinish = 'original' | 'obsidian' | 'graphite'
export type StrapFinish = 'original' | 'noir' | 'ash'
export type AccentFinish = 'original' | 'champagne' | 'silver'
export type Selection = { caseFinish: CaseFinish; strap: StrapFinish; accents: AccentFinish }
export const ORIGINAL: Selection = { caseFinish: 'original', strap: 'original', accents: 'original' }
export type MaterialGroup = keyof Selection
export type Scope = 'case' | 'backRing' | 'leather' | 'gold' | 'brass'
export const SCOPES: Record<Scope, { material: string; nodes: readonly string[]; category: MaterialGroup }> = {
  case: { material: 'Case_DarkSteel', category: 'caseFinish', nodes: ['Case_Midbody', 'Case_FacetedBezel', 'Case_Static_CaseDarkSteel', 'Crown_KnurledBody', 'Crown_Static_CaseDarkSteel'] },
  backRing: { material: 'Movement_Ruthenium', category: 'caseFinish', nodes: ['Case_BackRing'] },
  leather: { material: 'Strap_BlackLeather', category: 'strap', nodes: ['Strap_LowerLeather', 'Strap_UpperLeather', 'Strap_Static_StrapBlackLeather'] },
  gold: { material: 'Accent_ChampagneGold', category: 'accents', nodes: ['Case_Static_AccentChampagneGold', 'Crown_Static_AccentChampagneGold', 'Dial_Static_AccentChampagneGold', 'Hands_Hour', 'Hands_Seconds', 'Hands_Static_AccentChampagneGold', 'Rear_Static_AccentChampagneGold'] },
  brass: { material: 'Movement_BrushedBrass', category: 'accents', nodes: ['Case_Static_MovementBrushedBrass', 'Dial_Static_MovementBrushedBrass', 'Rear_Static_MovementBrushedBrass'] },
}
// RGB is explicitly linear-sRGB. Maps, physical features and glass are never variant properties.
type PBR = { rgb: [number, number, number]; roughness?: number; metalness?: number }
export const CASE_PBR: Record<Exclude<CaseFinish, 'original'>, PBR> = {
  obsidian: { rgb: [.018, .023, .030], roughness: .28, metalness: 1 },
  graphite: { rgb: [.18, .205, .235], roughness: .39, metalness: 1 },
}
export const STRAP_PBR: Record<Exclude<StrapFinish, 'original'>, PBR> = {
  noir: { rgb: [.0045, .005, .006], metalness: 0 },
  ash: { rgb: [.26, .25, .23], metalness: 0 },
}
export const ACCENT_PBR: Record<Exclude<AccentFinish, 'original'>, { gold: PBR; brass: PBR }> = {
  champagne: { gold: { rgb: [.63, .47, .25] }, brass: { rgb: [.40, .315, .18] } },
  silver: { gold: { rgb: [.60, .64, .70] }, brass: { rgb: [.36, .40, .46] } },
}
