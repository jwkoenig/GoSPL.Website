'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const BASE = process.env.NEXT_PUBLIC_BASEPATH || ''

const LINKS = [
  { href: '/#work', label: 'Work' },
  { href: '/#about', label: 'About' },
  { href: '/contact/', label: 'Contact' },
]

export default function Header() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!isHome) return
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  const solid = !isHome || scrolled
  const logo = solid ? `${BASE}/assets/logo/logo-black.svg` : `${BASE}/assets/logo/logo-white.svg`

  return (
    <header className={`topbar ${solid ? 'solid' : 'transparent'}`}>
      <div className="topbar-inner">
        <a href={`${BASE}/`} className="brand">
          <img src={logo} alt="GoSPL" />
        </a>
        <nav className="nav">
          {LINKS.map((l) => (
            <a key={l.href} href={`${BASE}${l.href}`}>{l.label}</a>
          ))}
        </nav>
        <button
          className={`burger ${open ? 'open' : ''}`}
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      {open && (
        <div className="nav-drawer">
          {LINKS.map((l) => (
            <a key={l.href} href={`${BASE}${l.href}`} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
        </div>
      )}
    </header>
  )
}
