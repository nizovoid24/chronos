import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { SceneBoundary } from './SceneBoundary'
import { useSceneActivity } from '../hooks/useSceneActivity'
import { AtelierControls, type RegistryStatus } from '../atelier/AtelierControls'
import { useAtelierState } from '../atelier/AtelierState'
import { useAtelierDialog } from '../atelier/useAtelierDialog'
import { ORIGINAL } from '../three/materialVariants'
import type { SceneCommand } from '../three/types'
import '../atelier/atelier.css'

const AionScene = lazy(() => import('../three/AionScene'))
export function WatchViewer({ exploreSignal }: { exploreSignal: number }) {
  const { ref, active } = useSceneActivity()
  const reducedMotion = Boolean(useReducedMotion())
  const [atelier, dispatch] = useAtelierState()
  const [status, setStatus] = useState<RegistryStatus | null>(null)
  const [started, setStarted] = useState(false)
  const [ready, setReady] = useState(false)
  const [posterHidden, setPosterHidden] = useState(false)
  const [failed, setFailed] = useState(false)
  const [interactive, setInteractive] = useState(false)
  const [moving, setMoving] = useState(!reducedMotion)
  const [command, setCommand] = useState<SceneCommand>({ id: 0, action: 'reset' })
  const viewerRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const scrollBeforeOpen = useRef<{ x: number; y: number } | null>(null)
  const previousInteractive = useRef(false)
  const close = useCallback(() => { dispatch({ type: 'close' }); setInteractive(previousInteractive.current); setMoving(false) }, [])
  useAtelierDialog(atelier.open, ref, openerRef, scrollBeforeOpen, close)
  useEffect(() => { if (active || atelier.open) setStarted(true) }, [active, atelier.open])
  useEffect(() => { if (reducedMotion) setMoving(false) }, [reducedMotion])
  useEffect(() => {
    if (!ready || failed) setPosterHidden(false)
    else if (reducedMotion) setPosterHidden(true)
  }, [ready, failed, reducedMotion])
  useEffect(() => {
    if (exploreSignal > 0) { setInteractive(true); setMoving(false); viewerRef.current?.focus({ preventScroll: true }) }
  }, [exploreSignal])
  useEffect(() => { setInteractive(matchMedia('(pointer: fine)').matches) }, [])
  const fail = useCallback(() => { setFailed(true); setReady(false) }, [])
  const loaded = useCallback(() => setReady(true), [])
  const stopMotion = useCallback(() => setMoving(false), [])
  const act = (action: SceneCommand['action']) => {
    setMoving(false); setInteractive(true)
    if (atelier.open && action === 'reset') dispatch({ type: 'focus', focus: 'full' })
    setCommand(previous => ({ id: previous.id + 1, action }))
  }
  return <div className={`watch-viewer ${atelier.open ? 'atelier-open' : ''}`} ref={ref} lang={atelier.open ? 'en' : 'ru'}
    role={atelier.open ? 'dialog' : undefined} aria-modal={atelier.open || undefined} aria-labelledby={atelier.open ? 'atelier-title' : undefined}>
    <header className="atelier-header" hidden={!atelier.open}>
      <div><span className="atelier-wordmark">CHRONOS</span><h2 id="atelier-title">AION INTERACTIVE ATELIER</h2></div>
      <button type="button" data-atelier-close onClick={close}>Return to Website <span aria-hidden="true">↗</span></button>
    </header>
    <div ref={viewerRef} className={`watch-stage ${interactive || atelier.open ? 'is-interactive' : ''} ${ready && !failed ? 'is-ready' : ''}`} id="watch-viewer"
      role="region" aria-label={atelier.open ? 'Interactive AION watch' : 'Трёхмерный осмотр часов AION'} aria-describedby="viewer-help" tabIndex={0}
      onKeyDown={event => {
        if (event.target !== event.currentTarget || failed) return
        const actions: Record<string, SceneCommand['action']> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', Home: 'reset', '+': 'zoomIn', '=': 'zoomIn', '-': 'zoomOut' }
        if (actions[event.key]) { event.preventDefault(); act(actions[event.key]) }
        if (event.key === 'Escape' && !atelier.open) { setInteractive(false); setMoving(false) }
      }}>
      <img className={`watch-poster ${ready && !failed ? 'is-hidden' : ''}`} src={`${import.meta.env.BASE_URL}images/aion-poster.jpg`}
        hidden={posterHidden && ready && !failed} aria-hidden={ready && !failed || undefined}
        onTransitionEnd={event => { if (event.propertyName === 'opacity' && ready && !failed) setPosterHidden(true) }}
        alt="CHRONOS AION: тёмная сталь, золотые акценты, открытый циферблат и чёрный кожаный ремешок" width="1400" height="1400" fetchPriority="high" />
      {started && !failed && <SceneBoundary onError={fail}><Suspense fallback={null}>
        <AionScene active={active} interactive={interactive || atelier.open} moving={moving && posterHidden && !reducedMotion && !atelier.open} command={command}
          atelier={atelier.open} selection={atelier.open ? atelier.selection : ORIGINAL} focus={atelier.open ? atelier.focus : 'full'} focusVersion={atelier.version} reducedMotion={reducedMotion}
          onRegistry={setStatus} onReady={loaded} onError={fail} onInteract={stopMotion} onMotionEnd={stopMotion} />
      </Suspense></SceneBoundary>}
    </div>
    <div className="hero-viewer-ui" hidden={atelier.open}>
      <div className="viewer-caption" aria-live="polite" role="status">
        {failed ? 'Статичный ракурс · интерактивный осмотр недоступен' : ready ? 'AION / ИНТЕРАКТИВНЫЙ ОСМОТР' : 'AION / ПОДГОТОВКА ЭКСПОЗИЦИИ'}
      </div>
      {failed ? <button className="text-button retry" onClick={() => window.location.reload()}>Повторить загрузку ↗</button> :
        <div className="viewer-tools" aria-label="Управление осмотром">
          <button disabled={!ready} aria-pressed={interactive} onClick={() => { setInteractive(!interactive); setMoving(false) }}>{interactive ? 'Завершить осмотр' : 'Вращать часы'}</button>
          <button disabled={!ready} aria-label="Повернуть часы влево" onClick={() => act('left')}>←</button>
          <button disabled={!ready} aria-label="Повернуть часы вправо" onClick={() => act('right')}>→</button>
          <button disabled={!ready} aria-label="Вернуть начальный ракурс" onClick={() => act('reset')}>↺</button>
          {!reducedMotion && <button disabled={!ready} aria-pressed={moving} aria-label={moving ? 'Остановить движение' : 'Лёгкое движение на 8 секунд'} onClick={() => setMoving(!moving)}>{moving ? 'Ⅱ' : '▷'}</button>}
        </div>}
      <button type="button" className="atelier-launch" lang="en" aria-label="Open AION Interactive Atelier" aria-haspopup="dialog" onClick={event => {
        openerRef.current = event.currentTarget; previousInteractive.current = interactive
        scrollBeforeOpen.current = { x: window.scrollX, y: window.scrollY }
        setMoving(false); dispatch({ type: 'open' })
      }}>Atelier <span aria-hidden="true">↗</span></button>
    </div>
    <p id="viewer-help" className="viewer-help" hidden={atelier.open}>{atelier.open ? 'Drag to rotate. Scroll or pinch to zoom. Arrow keys rotate; plus and minus zoom; Home frames the full watch.' : failed ? 'Оригинальный студийный рендер AION v0.2' : interactive ? 'Потяните для вращения · стрелки на клавиатуре · Home — сброс' : 'Включите осмотр, чтобы вращать часы'}</p>
    <AtelierControls open={atelier.open} ready={ready} failed={failed} selection={atelier.selection} focus={atelier.focus} status={status}
      onSelect={(group,value) => dispatch({ type: 'select',group,value })} onFocus={focus => { stopMotion(); dispatch({type:'focus',focus}) }} onReset={() => { stopMotion(); dispatch({type:'reset'}) }} />
    <footer className="atelier-toolbar" hidden={!atelier.open}>
      <p className="atelier-status" role="status" aria-live="polite">{failed ? 'Interactive scene unavailable. You can return to the website.' : ready ? 'AION / DESIGN CONCEPT' : 'Preparing AION…'}</p>
      <div aria-label="Watch controls">
        <button type="button" disabled={!ready || failed} aria-label="Rotate left" onClick={() => act('left')}>←</button>
        <button type="button" disabled={!ready || failed} aria-label="Rotate right" onClick={() => act('right')}>→</button>
        <button type="button" disabled={!ready || failed} aria-label="Tilt up" onClick={() => act('up')}>↑</button>
        <button type="button" disabled={!ready || failed} aria-label="Tilt down" onClick={() => act('down')}>↓</button>
        <span className="atelier-tool-divider" />
        <button type="button" disabled={!ready || failed} aria-label="Zoom in" onClick={() => act('zoomIn')}>+</button>
        <button type="button" disabled={!ready || failed} aria-label="Zoom out" onClick={() => act('zoomOut')}>−</button>
      </div>
    </footer>
  </div>
}
