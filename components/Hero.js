'use client'

import { Fragment, useEffect, useRef, useState } from 'react'

const BASE = process.env.NEXT_PUBLIC_BASEPATH || ''
const TITLE = 'Step inside the space'

// Hero videos live on the web server only (public/assets/HERO is not in git).
// Each slide needs hero_<name>_720p.mp4, hero_<name>_1080p.mp4 and
// hero_<name>_poster.jpg there. Slides play in this order.
const SLIDES = [
  { id: 'motorbike', label: 'Motorbike' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'cabin', label: 'Cabin' },
  { id: 'biplane', label: 'Biplane' },
]
const heroFile = (id, suffix) => `${BASE}/assets/HERO/hero_${id}_${suffix}`

// Phones get the 720p encode, wider screens the 1080p one. Matches the 820px
// breakpoint in globals.css and Founders.js.
const MOBILE_MQ = '(max-width: 820px)'
// Watchdog: while a clip should be playing it is checked every second and play()
// is retried if the browser paused or refused it. If it makes no progress for this
// long (blocked autoplay, stalled download, missing file) the hero moves on.
const STALL_MS = 8000

export default function Hero() {
  const [active, setActive] = useState(0)
  const [kbFocus, setKbFocus] = useState(false) // keyboard focus inside the hero pauses it
  const [res, setRes] = useState(null) // '720p' | '1080p', picked on the client
  const videos = useRef([])
  const activeRef = useRef(0)
  const pausedRef = useRef(false)

  // Choose the resolution after mount, so a phone never requests the 1080p files.
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const update = () => setRes(mq.matches ? '720p' : '1080p')
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const next = () => setActive((v) => (v + 1) % SLIDES.length)

  const playActive = () => {
    const v = videos.current[activeRef.current]
    if (!v || !v.paused || pausedRef.current) return
    v.muted = true // property, not just the attribute: autoplay policies check this
    if (v.ended) v.currentTime = 0
    v.play().catch(() => {}) // a refusal is retried by the watchdog
  }

  // Show the new slide from its start; pause every other clip.
  useEffect(() => {
    activeRef.current = active
    videos.current.forEach((v, i) => {
      if (!v) return
      if (i === active) { if (v.readyState > 0) v.currentTime = 0 }
      else v.pause()
    })
  }, [active])

  // Start, keep alive and advance the active clip.
  useEffect(() => {
    if (!res) return
    // reduced motion: never play, posters only (dots still switch slides)
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    pausedRef.current = still || kbFocus
    const v = videos.current[active]
    if (pausedRef.current) { v?.pause(); return }

    playActive()
    let lastTime = -1
    let lastProgress = Date.now()
    const id = setInterval(() => {
      const cur = videos.current[active]
      if (!cur || document.hidden) { lastProgress = Date.now(); return }
      if (cur.currentTime !== lastTime) { lastTime = cur.currentTime; lastProgress = Date.now() }
      if (Date.now() - lastProgress > STALL_MS) { next(); return }
      playActive()
    }, 1000)

    // Some browsers (iOS Low Power Mode, data saver) only allow play() inside a user
    // gesture: retry on the first tap/click/key/scroll anywhere on the page.
    const gestures = ['pointerdown', 'touchstart', 'keydown', 'scroll']
    gestures.forEach((g) => window.addEventListener(g, playActive, { passive: true }))
    document.addEventListener('visibilitychange', playActive)
    return () => {
      clearInterval(id)
      gestures.forEach((g) => window.removeEventListener(g, playActive))
      document.removeEventListener('visibilitychange', playActive)
    }
  }, [active, kbFocus, res])

  return (
    <section
      className="hero"
      onFocus={(e) => { if (e.target.matches(':focus-visible')) setKbFocus(true) }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setKbFocus(false) }}
    >
      {SLIDES.map((s, i) => (
        <div key={s.id} className={`hero-slide ${i === active ? 'active' : ''}`}>
          <video
            ref={(el) => { videos.current[i] = el }}
            src={res ? heroFile(s.id, `${res}.mp4`) : undefined}
            poster={heroFile(s.id, 'poster.jpg')}
            muted
            playsInline
            // the active clip and the one after it load; the rest wait on their posters
            preload={i === active || i === (active + 1) % SLIDES.length ? 'auto' : 'none'}
            onEnded={() => { if (i === activeRef.current) next() }}
            aria-hidden="true"
          />
        </div>
      ))}
      <div className="hero-scrim" />

      <div className="hero-content">
        <div className="hero-stack">
        <h1 className="hero-title">
          {/* the space sits between the spans: a trailing space inside an inline-block gets dropped */}
          {TITLE.split(' ').map((w, i) => (
            <Fragment key={i}>
              {i > 0 && ' '}
              <span className="word" style={{ animationDelay: `${i * 0.08}s` }}>{w}</span>
            </Fragment>
          ))}
        </h1>
        <p className="hero-sub">We consult, conceptualise and create immersive media.</p>
        <a href="#work" className="hero-cta">
          Take a tour
          <img className="arrow" src={`${BASE}/assets/icon_arrow_r.png`} alt="" />
        </a>

        <div className="hero-dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              className={`hero-dot ${i === active ? 'active' : ''}`}
              aria-label={`Show ${s.label}`}
              onClick={() => setActive(i)}
            >
              <img
                src={`${BASE}/assets/${i === active ? 'Line%201.png' : 'Line%202.png'}`}
                alt=""
              />
            </button>
          ))}
        </div>
        </div>
      </div>
    </section>
  )
}
