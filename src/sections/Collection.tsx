import { CampaignImage } from '../components/CampaignImage'
import { ExploreLink } from '../components/ExploreLink'
import { Reveal } from '../components/Reveal'
export function Collection({ onExplore }: { onExplore: () => void }) {
  return <section className="collection editorial-section" id="collection" aria-labelledby="collection-title">
    <Reveal className="collection-header"><p className="section-kicker"><span>03</span> THE COLLECTION</p><span className="collection-edition">AION / DESIGN CONCEPT 001</span></Reveal>
    <div className="collection-layout">
      <Reveal className="collection-image"><CampaignImage asset="campaign" alt="AION resting on dark stone, with polished steel, gold details and black leather" sizes="(max-width: 900px) 100vw, 65vw" /><span className="collection-image-note">FORM, REVEALED BY LIGHT.</span></Reveal>
      <Reveal className="collection-copy" delay={0.1}><h2 className="display-heading" id="collection-title"><span className="collection-name">AION.</span><em>A STUDY<br />IN TIME.</em></h2><p className="editorial-body">A balance of shadow and warmth. AION brings a dark circular case, an open dial and champagne-gold accents into a single, deliberate silhouette.</p>
        <dl className="design-details"><div><dt>Silhouette</dt><dd>Circular, sculpted steel</dd></div><div><dt>Composition</dt><dd>Open, layered dial</dd></div><div><dt>Contrast</dt><dd>Champagne gold & black leather</dd></div></dl><ExploreLink onExplore={onExplore} />
      </Reveal>
    </div>
  </section>
}
