import { useCallback, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Navigation } from './components/Navigation'
import { Footer } from './components/Footer'
import { Hero } from './sections/Hero'
import { Philosophy } from './sections/Philosophy'
import { Anatomy } from './sections/Anatomy'
import { Collection } from './sections/Collection'
import { BeyondTime } from './sections/BeyondTime'
export function App() {
  const [exploreSignal, setExploreSignal] = useState(0)
  const reduced = useReducedMotion()
  const explore = useCallback(() => {
    if (location.hash !== '#aion') history.pushState(null, '', '#aion')
    document.getElementById('aion')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    setExploreSignal(signal => signal + 1)
  }, [reduced])
  return <><a className="skip-link" href="#main">Skip to content</a><Navigation /><main id="main"><Hero exploreSignal={exploreSignal} onExplore={explore} /><Philosophy /><Anatomy /><Collection onExplore={explore} /><BeyondTime onExplore={explore} /></main><Footer /></>
}
