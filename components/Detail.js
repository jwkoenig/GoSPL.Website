'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const BASE = process.env.NEXT_PUBLIC_BASEPATH || ''
const OPEN_MS = 700
const INNER_DELAY_MS = 120
const FOCUSABLE = 'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'

const SPECS = [
  { k: 'Splats', key: 'splats' },
  { k: 'Area', key: 'area' },
  { k: 'Capture', key: 'capture' },
]

// Parses markdown-style [text](url) links inside project body copy into real anchors.
const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
function renderBodyLinks(text) {
  const parts = []
  let last = 0
  for (const m of text.matchAll(LINK_RE)) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push(
      <a key={m.index} href={m[2]} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
        {m[1]}
      </a>
    )
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export default function Detail({ project, originRect, onClose, onNav, hasPrev, hasNext }) {
  const [phase, setPhase] = useState('in') // 'in' -> 'open' -> 'closing'
  const [innerOn, setInnerOn] = useState(false)
  const [splashOut, setSplashOut] = useState(false)
  const cloneRef = useRef(null)
  const rootRef = useRef(null)
  const closeRef = useRef(null)
  const triggerRef = useRef(null)

  useLayoutEffect(() => {
    if (!cloneRef.current || !originRect) return
    // start pinned to the clicked tile's rect
    const el = cloneRef.current
    el.style.top = `${originRect.top}px`
    el.style.left = `${originRect.left}px`
    el.style.width = `${originRect.width}px`
    el.style.height = `${originRect.height}px`

    const t = setTimeout(() => {
      setPhase('open')
    }, 20)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLayoutEffect(() => {
    if (phase !== 'open') return
    const t = setTimeout(() => setInnerOn(true), INNER_DELAY_MS)
    return () => clearTimeout(t)
  }, [phase])

  // remember what had focus (the tile that opened this overlay) and restore it on close
  useEffect(() => {
    triggerRef.current = document.activeElement
    return () => triggerRef.current?.focus?.()
  }, [])

  // move focus into the dialog once it has visually settled in
  useEffect(() => {
    if (innerOn) closeRef.current?.focus()
  }, [innerOn])

  const handleClose = () => {
    setInnerOn(false)
    setPhase('closing')
    setTimeout(() => onClose(), OPEN_MS)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      handleClose()
      return
    }
    if (e.key !== 'Tab' || !rootRef.current) return
    const focusable = Array.from(rootRef.current.querySelectorAll(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const handleNav = (dir) => {
    setInnerOn(false)
    setSplashOut(false)
    onNav(dir)
  }

  const cloneStyle =
    phase === 'in'
      ? {}
      : { top: 0, left: 0, width: '100vw', height: '100vh' }

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      onKeyDown={handleKeyDown}
    >
      <div className={`detail-scrim ${phase !== 'in' ? 'on' : ''}`} />

      <div ref={cloneRef} className="detail-clone" style={cloneStyle}>
        <img src={project.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <button
        ref={closeRef}
        className={`detail-close-persistent ${innerOn ? 'on' : ''}`}
        onClick={handleClose}
        aria-label="Close"
      >
        Close ✕
      </button>

      <div className={`detail-prevnext-bar ${innerOn ? 'on' : ''}`}>
        <button
          className="detail-prevnext prev"
          onClick={() => hasPrev && handleNav('prev')}
          disabled={!hasPrev}
        >
          <img className="arrow" src={`${BASE}/assets/icon_arrow_r.png`} alt="" />
          Prev project
        </button>
        <button
          className="detail-prevnext next"
          onClick={() => hasNext && handleNav('next')}
          disabled={!hasNext}
        >
          Next project
          <img className="arrow" src={`${BASE}/assets/icon_arrow_r.png`} alt="" />
        </button>
      </div>

      <div className={`detail-inner ${innerOn ? 'on' : ''}`}>
        <div className="detail-hero">
          {project.url ? (
            <iframe className="detail-tour-frame" src={project.url} title={project.title} allow="xr-spatial-tracking" />
          ) : (
            <img className="detail-tour-bg" src={project.img} alt={project.title} />
          )}
          <div className="detail-herofade" />

          {!project.url && <div className="detail-coming-soon">Coming soon</div>}

          <div className={`detail-splash ${splashOut ? 'out' : ''}`} onClick={() => setSplashOut(true)}>
            <div className="detail-splash-inner">
              <h1 id="detail-title">{project.title}</h1>
              <div className="detail-splash-meta">
                <span>{project.type}</span>
                <span>·</span>
                <span>{project.place}</span>
                <span>·</span>
                <span>{project.year}</span>
              </div>
              <p className="detail-splash-lead">{project.lead}</p>
              <div className="detail-splash-body">
                {project.body.map((p, i) => (
                  <p key={i}>{renderBodyLinks(p)}</p>
                ))}
              </div>

              <div className="detail-splash-specs">
                {SPECS.map((s) => (
                  <span key={s.key} className="spec-item">
                    {s.k} <b>{project[s.key]}</b>
                  </span>
                ))}
              </div>

              {project.url ? (
                <a
                  className="detail-tour-btn"
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open full tour
                  <img className="arrow" src={`${BASE}/assets/icon_arrow_r.png`} alt="" />
                </a>
              ) : (
                <div className="detail-splash-hint">Click to view</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
