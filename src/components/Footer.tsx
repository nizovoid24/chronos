import { navigationLinks } from '../data/navigation'
export function Footer() {
  return <footer className="site-footer" id="colophon">
    <div className="footer-top"><a href="#aion" className="footer-wordmark">CHRONOS</a><p>TIME IS THE ULTIMATE LUXURY</p><a href="#aion" className="back-top" aria-label="Back to AION">↑</a></div>
    <nav aria-label="Footer navigation">{navigationLinks.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}</nav>
    <div className="footer-bottom"><span>© CHRONOS 2026</span><p>A concept experience by <span>KALLISTO IT-AGENCY.</span></p></div>
    <p className="concept-note">CHRONOS is a fictional watch brand. AION is a design concept; its visible movement is decorative.</p>
  </footer>
}
