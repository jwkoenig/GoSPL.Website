'use client'

import { Fragment, useEffect, useRef, useState } from 'react'

const BASE = process.env.NEXT_PUBLIC_BASEPATH || ''
const TITLE = 'Step inside the space'

// Hero videos live on the web server only (public/assets/HERO is not in git).
// Each slide needs hero_<name>_720p.mp4, hero_<name>_1080p.mp4 and
// hero_<name>_poster.jpg there. Slides play in this order.
const SLIDES = [
  { id: 'biplane', label: 'Biplane' },
  { id: 'cabin', label: 'Cabin' },
  { id: 'motorbike', label: 'Motorbike' },
  { id: 'restaurant', label: 'Restaurant' },
]
const heroFile = (id, suffix) => `${BASE}/assets/HERO/hero_${id}_${suffix}`

// Phones get the 720p encode, wider screens the 1080p one. Matches the 820px
// breakpoint in globals.css and Founders.js.
const MOBILE_MQ = '(max-width: 820px)'
// If a clip can't play (blocked autoplay, missing file), move on after this long.
const FALLBACK_MS = 6000

export default function Hero() {
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [res, setRes] = useState(null) // '720p' | '1080p', picked on the client
  const videos = useRef([])
  const paused = hovered

  // Choose the resolution after mount, so a phone never requests the 1080p files.
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const update = () => setRes(mq.matches ? '720p' : '1080p')
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const next = () => setActive((v) => (v + 1) % SLIDES.length)

  // Play only the active clip; the rest stay paused on their posters.
  useEffect(() => {
    if (!res) return
    // reduced motion: never play, posters only (dots still switch slides)
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let fallback
    videos.current.forEach((v, i) => {
      if (!v) return
      if (i !== active) {
        v.pause()
        return
      }
      if (paused || still) {
        v.pause()
        return
      }
      if (v.ended) v.currentTime = 0
      v.play().catch(() => {
        fallback = setTimeout(next, FALLBACK_MS)
      })
    })
    return () => clearTimeout(fallback)
  }, [active, paused, res])

  // A newly shown clip starts from the beginning.
  useEffect(() => {
    const v = videos.current[active]
    if (v && v.readyState > 0) v.currentTime = 0
  }, [active])

  return (
    <section
      className="hero"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {SLIDES.map((s, i) => (
        <div key={s.id} className={`hero-slide ${i === active ? 'active' : ''}`}>
          <video
            ref={(el) => { videos.current[i] = el }}
            src={res ? heroFile(s.id, `${res}.mp4`) : undefined}
            poster={heroFile(s.id, 'poster.jpg')}
            muted
            playsInline
            preload={i === active ? 'auto' : 'none'}
            onEnded={() => { if (i === active) next() }}
            aria-hidden="true"
          />
        </div>
      ))}
      <div className="hero-scrim" />

      <div className="hero-content">
        <div className="hero-stack">
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

// Title and subline, shown below the hero (in place of the stats band).
export function HeroIntro() {
  return (
    <section className="hero-intro">
      <div className="wrap">
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
      </div>
    </section>
  )
}
