'use client'

import { useEffect, useRef, useState } from 'react'
import { FOUNDERS } from '@/data/team'

// Live splat iframes only on desktop; matches the 820px breakpoint in globals.css.
const DESKTOP_MQ = '(min-width: 821px)'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ)
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return isDesktop
}

function initials(name) {
  return name.split(' ').map((w) => w[0]).filter((c) => c === c.toUpperCase()).slice(0, 2).join('')
}

function FounderMedia({ founder, live }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  const imgRef = useRef(null)
  const [imgFailed, setImgFailed] = useState(false)

  // an SSR'd <img> can fail before hydration attaches onError
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth === 0) setImgFailed(true)
  }, [live])

  // mount the WebGL viewer only once the card is near the viewport
  useEffect(() => {
    if (!live || inView || !ref.current) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [live, inView])

  if (live) {
    return (
      <div ref={ref} className="founder-media">
        {inView && (
          <iframe
            src={founder.splat}
            title={`${founder.name}, 3D splat headshot`}
            loading="lazy"
            allow="xr-spatial-tracking"
          />
        )}
      </div>
    )
  }

  return (
    <a
      className="founder-media"
      href={founder.splat}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${founder.name}, view 3D splat headshot`}
    >
      {imgFailed ? (
        <span className="founder-initials" aria-hidden="true">{initials(founder.name)}</span>
      ) : (
        <img ref={imgRef} src={founder.img} alt="" onError={() => setImgFailed(true)} />
      )}
      <span className="founder-3d">View in 3D ↗</span>
    </a>
  )
}

export default function Founders() {
  const isDesktop = useIsDesktop()

  return (
    <div className="founders-block">
      <h3 className="about-sub">The people behind it</h3>
      <p className="about-sub-lead">
        Two founders, scanned the way we scan everything else.
        {isDesktop ? ' Drag to look around.' : ' Tap to look around.'}
      </p>
      <div className="founders">
        {FOUNDERS.map((f) => (
          <figure key={f.id} className="founder">
            <FounderMedia founder={f} live={isDesktop} />
            <figcaption className="founder-name">{f.name}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
