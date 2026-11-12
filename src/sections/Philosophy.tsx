import { CinematicImage } from '../components/CinematicImage'
import { Reveal } from '../components/Reveal'
export function Philosophy() {
  return <section className="philosophy cinematic-section" id="philosophy" aria-labelledby="philosophy-title">
    <CinematicImage asset="philosophy" alt="AION in a dark stone hall, with warm light falling through monumental arches" /><div className="cinematic-shade" />
    <div className="philosophy-content">
      <Reveal><p className="section-kicker"><span>01</span> THE PHILOSOPHY</p></Reveal>
      <Reveal delay={0.08}><h2 className="display-heading" id="philosophy-title">TIME IS NOT MEASURED.<br /><em>IT IS EXPERIENCED.</em></h2></Reveal>
      <Reveal delay={0.16}><div className="philosophy-note"><span className="editorial-rule" /><p>Some moments ask for more than a number. They ask us to pause. To notice light, texture and the quiet space between one instant and the next. AION is an exploration of that space.</p></div></Reveal>
    </div><span className="scene-caption">CHRONOS / AN ARCHITECTURE OF STILLNESS</span>
  </section>
}
