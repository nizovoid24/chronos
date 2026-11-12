import { useRef, useState } from 'react'
import { navigationLinks } from '../data/navigation'
export function Navigation() {
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  return <header className="navigation" onKeyDown={event => { if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus() } }}>
    <a href="#aion" className="wordmark" aria-label="CHRONOS — back to AION">CHRONOS<span>ARCHITECTURE OF TIME</span></a>
    <button className="nav-toggle" ref={toggle} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}<span aria-hidden="true">{open ? '−' : '+'}</span></button>
    <nav id="primary-navigation" className={open ? 'is-open' : ''} aria-label="Main navigation">
      {navigationLinks.map(link => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}{link.href === '#aion' && <span aria-hidden="true">↗</span>}</a>)}
    </nav>
  </header>
}
