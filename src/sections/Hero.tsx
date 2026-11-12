import { motion } from 'motion/react'
import { WatchViewer } from '../components/WatchViewer'

export function Hero({ exploreSignal, onExplore }: { exploreSignal: number; onExplore: () => void }) {
  return <section className="hero" id="aion" aria-labelledby="aion-title">
        <motion.div className="hero-heading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }}>
          <p className="eyebrow">CHRONOS · PREMIÈRE ÉDITION</p>
          <h1 id="aion-title">AION</h1>
          <p className="hero-motto">TIME IS THE ULTIMATE LUXURY.</p>
        </motion.div>
        <div className="hero-side hero-side-left"><span className="small-label">AN OBJECT OF TIME</span><p>Mechanical artistry.<br />Open to the eye.</p><span className="hairline" /></div>
        <WatchViewer exploreSignal={exploreSignal} />
        <div className="hero-side hero-side-right"><span className="small-label">ARCHITECTURE OF TIME</span><p>Dark steel.<br />Warm gold.<br />Nothing excessive.</p><button className="explore-button" onClick={onExplore}>Explore AION <span aria-hidden="true">↗</span></button></div>
        <a href="#philosophy" className="scroll-cue" aria-label="Discover the philosophy"><span />SCROLL TO DISCOVER</a>
        <div className="hero-reference" aria-hidden="true">AION — 001<br />DESIGN CONCEPT / 2026</div>
      </section>
}
