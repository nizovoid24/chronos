import { useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CampaignImage, type CampaignAsset } from '../components/CampaignImage'
import { Reveal } from '../components/Reveal'
import { useMediaQuery } from '../hooks/useMediaQuery'

const stories: { name: string; title: string; asset: CampaignAsset; alt: string; detail: string; description: string }[] = [
  { name: 'Movement', title: 'THE MOVEMENT', asset: 'macro', alt: 'A close view of AION’s layered bridges, dark wheels and champagne-gold accents', detail: 'LAYERS / LIGHT / RHYTHM', description: 'An open composition of wheels, sculpted bridges and slender hands. Dark surfaces recede; champagne-gold details draw the eye through the dial. A decorative study of mechanical form, made to be seen.' },
  { name: 'Case', title: 'THE CASE', asset: 'craftsmanship', alt: 'The polished dark case, fine golden rim and knurled crown of AION', detail: 'POLISH / SHADOW / CONTOUR', description: 'A circular silhouette, defined by its edges. Polished dark steel meets warm metallic accents, while the fluted crown and sculpted lugs give the design its quiet architectural character.' },
  { name: 'Strap', title: 'THE STRAP', asset: 'leather', alt: 'Black grained leather with warm contrasting stitching at the case attachment', detail: 'GRAIN / STITCH / TOUCH', description: 'Black leather brings a softer rhythm to the metal. A delicate grain, warm stitching and shaped edges complete the visual language of AION — considered down to the point where materials meet.' },
]
export function Anatomy() {
  const [selected, setSelected] = useState(0)
  const [displayed, setDisplayed] = useState(0)
  const [visited, setVisited] = useState([0])
  const [error, setError] = useState(false)
  const loaded = useRef(new Set<number>())
  const selectedRef = useRef(0)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const mobile = useMediaQuery('(max-width: 900px)')
  const reduced = useReducedMotion()
  const choose = (index: number, focus = false) => {
    selectedRef.current = index
    setSelected(index); setError(false)
    setVisited(previous => previous.includes(index) ? previous : [...previous, index])
    if (loaded.current.has(index)) setDisplayed(index)
    if (focus) buttons.current[index]?.focus()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    let next = selected
    if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (selected + 1) % stories.length
    else if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = (selected + stories.length - 1) % stories.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = stories.length - 1
    else return
    event.preventDefault(); choose(next, true)
  }
  const story = stories[selected]
  return <section className="anatomy editorial-section" id="anatomy" aria-labelledby="anatomy-title">
    <Reveal className="anatomy-heading"><div><p className="section-kicker"><span>02</span> THE ANATOMY OF AION</p><h2 className="display-heading" id="anatomy-title">ANATOMY<br /><em>OF PRECISION.</em></h2></div><p className="anatomy-intro">Three perspectives.<br />One considered whole.</p></Reveal>
    <Reveal className="anatomy-layout">
      <div className="anatomy-visual"><div className="anatomy-images" aria-busy={selected !== displayed && !error}>
        {visited.map(index => <motion.div key={index} className="anatomy-layer" initial={false} animate={{ opacity: index === displayed ? 1 : 0 }} transition={{ duration: reduced ? 0 : 0.55 }} aria-hidden={index !== displayed}>
          <CampaignImage asset={stories[index].asset} alt={stories[index].alt} sizes="(max-width: 900px) calc(100vw - 40px), 60vw"
            onLoad={() => { loaded.current.add(index); if (selectedRef.current === index) setDisplayed(index) }} onError={() => { if (selectedRef.current === index) setError(true) }} />
        </motion.div>)}
      </div><div className="anatomy-image-caption"><span>AION / DETAIL STUDY</span><span>{String(selected + 1).padStart(2, '0')} — 03</span></div></div>
      <div className="anatomy-aside">
        <div className="anatomy-tabs" role="tablist" aria-label="Explore the anatomy of AION" aria-orientation={mobile ? 'horizontal' : 'vertical'}>
          {stories.map((item, index) => <button key={item.name} ref={node => { buttons.current[index] = node }} type="button" role="tab" id={`anatomy-tab-${index}`} aria-selected={selected === index} aria-controls="anatomy-panel" tabIndex={selected === index ? 0 : -1} onClick={() => choose(index)} onKeyDown={onKeyDown}><span className="tab-number">0{index + 1}</span><span>{item.title}</span><span className="tab-arrow" aria-hidden="true">↗</span></button>)}
        </div>
        <div className="anatomy-panel" id="anatomy-panel" role="tabpanel" aria-labelledby={`anatomy-tab-${selected}`} tabIndex={0}>
          <AnimatePresence initial={false} mode="wait"><motion.div key={selected} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.2 }}><h3>{story.name}.</h3><p>{story.description}</p><span className="detail-label">{story.detail}</span></motion.div></AnimatePresence>
        </div>
        <p className="anatomy-disclosure">A design exploration. The visible mechanism is decorative.</p>
        <span className="sr-only" role="status">{error ? 'The selected photograph could not load.' : selected !== displayed ? 'Loading selected detail.' : `${story.title} photograph ready.`}</span>
      </div>
    </Reveal>
  </section>
}
