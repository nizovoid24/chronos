import { CinematicImage } from '../components/CinematicImage'
import { ExploreLink } from '../components/ExploreLink'
import { Reveal } from '../components/Reveal'
export function BeyondTime({ onExplore }: { onExplore: () => void }) {
  return <section className="beyond cinematic-section" id="beyond-time" aria-labelledby="beyond-title">
    <CinematicImage asset="beyond" alt="AION before a circular stone portal opening onto a warm sunset and distant mountains" /><div className="cinematic-shade" />
    <div className="beyond-content"><Reveal><p className="section-kicker"><span>04</span> BEYOND TIME</p></Reveal><Reveal delay={0.08}><h2 className="display-heading" id="beyond-title">BEYOND THE<br /><em>MEASURE OF TIME</em></h2></Reveal><Reveal delay={0.16}><p>Not every moment belongs to the clock.</p><ExploreLink onExplore={onExplore}>RETURN TO AION</ExploreLink></Reveal></div><span className="scene-caption">TIME IS THE ULTIMATE LUXURY</span>
  </section>
}
