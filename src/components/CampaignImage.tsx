import images from '../data/image-manifest.json'
export type CampaignAsset = keyof typeof images
type Props = { asset: CampaignAsset; alt: string; sizes?: string; className?: string; onLoad?: () => void; onError?: () => void }
export function CampaignImage({ asset, alt, sizes = '100vw', className = '', onLoad, onError }: Props) {
  const image = images[asset]
  const base = `${import.meta.env.BASE_URL}images/chronos/`
  return <picture className={`campaign-image ${className}`}>
    <source type="image/webp" srcSet={image.variants.map(variant => `${base}${variant.file} ${variant.width}w`).join(', ')} sizes={sizes} />
    <img src={`${base}${image.fallback}`} alt={alt} width={image.width} height={image.height} loading="lazy" decoding="async" fetchPriority="low" onLoad={onLoad} onError={onError} />
  </picture>
}
