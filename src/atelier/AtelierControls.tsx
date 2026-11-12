import { useState } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import type { FocusId } from '../three/cameraPresets'
import type { MaterialGroup, Selection } from '../three/materialVariants'
const FOCUS_LABELS: Record<FocusId,string> = { full: 'Full Watch', dial: 'Dial Detail', case: 'Case & Crown', strap: 'Leather Strap' }

const groups = [
  { id: 'caseFinish', number: '01', label: 'Case finish', items: [['original','Original','#30363b'],['obsidian','Obsidian Black','#16191d'],['graphite','Graphite Satin','#7c858c']] },
  { id: 'strap', number: '02', label: 'Strap', items: [['original','Original','#242321'],['noir','Noir Leather','#111110'],['ash','Ash Leather','#a29d93']] },
  { id: 'accents', number: '03', label: 'Metal accents', items: [['original','Original','#ab8a53'],['champagne','Champagne Gold','#c3a573'],['silver','Silver','#b6bec8']] },
] as const
export type RegistryStatus = { available: Record<MaterialGroup, boolean>; errors: string[] }
type Props = {
  open: boolean; ready: boolean; failed: boolean; selection: Selection; focus: FocusId; status: RegistryStatus | null
  onSelect: (group: MaterialGroup, value: string) => void; onFocus: (focus: FocusId) => void; onReset: () => void
}
export function AtelierControls({ open, ready, failed, selection, focus, status, onSelect, onFocus, onReset }: Props) {
  const compact = useMediaQuery('(max-width: 900px)')
  const [active, setActive] = useState<MaterialGroup>('caseFinish')
  return <aside className="atelier-panel" hidden={!open} aria-label="Atelier configuration" lang="en">
    <div className="atelier-introduction"><p className="atelier-kicker">EXPLORE THE ART OF TIME</p><h3>Your expression.<br /><em>Our architecture.</em></h3><p>Three considered finishes. One singular AION.</p></div>
    <div className="atelier-category-tabs" role="tablist" aria-label="Configuration category">
      {groups.map(g => <button key={g.id} type="button" id={'category-'+g.id} role="tab" aria-selected={active === g.id} aria-controls={'finish-'+g.id} tabIndex={active === g.id ? 0 : -1}
        onClick={() => setActive(g.id)} onKeyDown={e => {
          if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return
          e.preventDefault()
          const i = groups.findIndex(g => g.id === active), next = e.key === 'Home' ? 0 : e.key === 'End' ? 2 : (i + (e.key === 'ArrowRight' ? 1 : 2)) % 3
          setActive(groups[next].id); document.getElementById('category-'+groups[next].id)?.focus()
        }}><span>{g.number}</span>{g.label}</button>)}
    </div>
    <div className="atelier-finishes">
      {groups.map(g => <div key={g.id} id={'finish-'+g.id} hidden={compact && active !== g.id} role={compact ? 'tabpanel' : undefined} aria-labelledby={compact ? 'category-'+g.id : undefined}>
        <fieldset disabled={!ready || failed || !status?.available[g.id]}>
          <legend><span>{g.number}</span> {g.label}</legend>
          <div className="atelier-options">{g.items.map(([value,label,color]) => <label key={value} className={selection[g.id] === value ? 'is-selected' : ''}>
            <input type="radio" name={'atelier-'+g.id} value={value} checked={selection[g.id] === value} onChange={() => onSelect(g.id,value)} />
            <span className="atelier-swatch" style={{ backgroundColor: color }} aria-hidden="true" /><span>{label}</span><span className="atelier-check" aria-hidden="true">✓</span>
          </label>)}</div>
        </fieldset>
        {status && !status.available[g.id] && <p className="atelier-warning">This finish is unavailable for the loaded model.</p>}
      </div>)}
    </div>
    <fieldset className="atelier-focus" disabled={!ready || failed}><legend>Camera perspective</legend><div>
      {(Object.entries(FOCUS_LABELS) as [FocusId,string][]).map(([id,label]) => <button type="button" key={id} aria-pressed={focus === id} onClick={() => onFocus(id)}>{label}<span aria-hidden="true">↗</span></button>)}
    </div></fieldset>
    <button className="atelier-reset" type="button" disabled={!ready || failed} onClick={onReset}>Reset to Original <span aria-hidden="true">↺</span></button>
    <p className="atelier-concept">AION is a design concept. Its mechanism is decorative.</p>
  </aside>
}
