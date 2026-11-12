import { useLayoutEffect, type RefObject } from 'react'

export function useAtelierDialog(open: boolean, root: RefObject<HTMLDivElement | null>, opener: RefObject<HTMLElement | null>, scrollBeforeOpen: RefObject<{ x: number; y: number } | null>, close: () => void) {
  useLayoutEffect(() => {
    const dialog = root.current
    if (!open || !dialog) return
    // Capture before the fixed viewer is committed: scroll anchoring can move the page during layout.
    const scroll = scrollBeforeOpen.current ?? { x: window.scrollX, y: window.scrollY }
    const body = document.body
    const saved = { position: body.style.position, top: body.style.top, left: body.style.left, width: body.style.width, overflow: body.style.overflow }
    const hidden: { element: HTMLElement; inert: boolean; aria: string | null }[] = []
    // Exclude ancestors: the existing Canvas lives inside Hero/main.
    for (let branch: HTMLElement | null = dialog; branch?.parentElement && branch !== body; branch = branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling === branch || !(sibling instanceof HTMLElement) || ['SCRIPT','STYLE'].includes(sibling.tagName)) continue
        hidden.push({ element: sibling, inert: sibling.inert, aria: sibling.getAttribute('aria-hidden') })
        sibling.inert = true; sibling.setAttribute('aria-hidden', 'true')
      }
    }
    body.dataset.atelierOpen = 'true'
    Object.assign(body.style, { position: 'fixed', top: -scroll.y + 'px', left: '0', width: '100%', overflow: 'hidden' })
    const focusable = () => [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),[tabindex="0"]')].filter(e => e.getClientRects().length && !e.closest('[hidden]'))
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return }
      if (event.key !== 'Tab') return
      const list = focusable(), first = list[0], last = list.at(-1)
      if (!first || !last) { event.preventDefault(); return }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handle, true)
    dialog.querySelector<HTMLButtonElement>('[data-atelier-close]')?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('keydown', handle, true)
      hidden.forEach(({element,inert,aria}) => { element.inert = inert; if (aria === null) element.removeAttribute('aria-hidden'); else element.setAttribute('aria-hidden',aria) })
      delete body.dataset.atelierOpen
      Object.assign(body.style, saved)
      const html = document.documentElement, oldScroll = html.style.scrollBehavior
      html.style.scrollBehavior = 'auto'
      window.scrollTo(scroll.x, scroll.y)
      opener.current?.focus({ preventScroll: true })
      html.style.scrollBehavior = oldScroll
    }
  }, [open, root, opener, scrollBeforeOpen, close])
}
