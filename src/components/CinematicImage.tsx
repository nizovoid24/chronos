import { useRef } from 'react'
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { CampaignImage, type CampaignAsset } from './CampaignImage'
export function CinematicImage({ asset, alt }: { asset: CampaignAsset; alt: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref)
  const desktop = useMediaQuery('(min-width: 901px)')
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [-16, 16])
  return <div className="cinematic-frame" ref={ref}><motion.div className="cinematic-parallax" style={desktop && visible && !reduced ? { y } : undefined}><CampaignImage asset={asset} alt={alt} /></motion.div></div>
}
