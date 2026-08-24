'use client'

import { useEffect, useState } from 'react'
import { PROJECTS } from '@/data/projects'

const BASE = process.env.NEXT_PUBLIC_BASEPATH || ''
const SLIDES = PROJECTS.slice(0, 4)
const TITLE = 'Step inside the space'

export default function Hero() {
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [manualPause, setManualPause] = useState(false)
  const paused = hovered || manualPause

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (paused || reduceMotion) return
    const id = setInterval(() => {
      setActive((v) => (v + 1) % SLIDES.length)
    }, 6000)
    return () => clearInterval(id)
  }, [paused])

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
          <img src={s.img} alt="" />
        </div>
      ))}
      <div className="hero-scrim" />

      <div className="hero-content">
        <div className="hero-stack">
        <h1 className="hero-title">
          {TITLE.split(' ').map((w, i) => (
            <span key={i} className="word" style={{ animationDelay: `${i * 0.08}s` }}>
              {w}{i < TITLE.split(' ').length - 1 ? ' ' : ''}
            </span>
          ))}
        </h1>
        <p className="hero-sub">
          We turn your spaces into interactive scenes, both scanned and rendered. We are
          your partner for capture, authoring and delivery.
        </p>
        <a href="#work" className="hero-cta">
          Take a tour
          <img className="arrow" src={`${BASE}/assets/icon_arrow_r.png`} alt="" />
        </a>

        <div className="hero-dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              className={`hero-dot ${i === active ? 'active' : ''}`}
              aria-label={`Show ${s.title}`}
              onClick={() => setActive(i)}
            >
              <img
                src={`${BASE}/assets/${i === active ? 'Line%201.png' : 'Line%202.png'}`}
                alt=""
              />
            </button>
          ))}
          <button
            type="button"
            className="hero-pause"
            aria-label={manualPause ? 'Play slideshow' : 'Pause slideshow'}
            aria-pressed={manualPause}
            onClick={() => setManualPause((v) => !v)}
          >
            {manualPause ? '▶' : '❚❚'}
          </button>
        </div>
        </div>
      </div>
    </section>
  )
}
