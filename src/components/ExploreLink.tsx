export function ExploreLink({ onExplore, children = 'EXPLORE AION', className = '' }: { onExplore: () => void; children?: string; className?: string }) {
  return <a className={`editorial-link ${className}`} href="#aion" onClick={event => { event.preventDefault(); onExplore() }}>{children}<span aria-hidden="true">↗</span></a>
}
