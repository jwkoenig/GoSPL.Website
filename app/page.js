'use client'

import { useCallback, useState } from 'react'
import Hero from '@/components/Hero'
import Stats from '@/components/Stats'
import WorkGrid from '@/components/WorkGrid'
import Detail from '@/components/Detail'
import AboutTeaser from '@/components/AboutTeaser'
import CtaBand from '@/components/CtaBand'
import { PROJECTS } from '@/data/projects'

export default function HomePage() {
  const [detail, setDetail] = useState(null)

  const handleOpen = useCallback((project, rect) => {
    setDetail({ project, rect })
  }, [])

  const handleClose = useCallback(() => {
    setDetail(null)
  }, [])

  const handleNav = useCallback((dir) => {
    setDetail((prev) => {
      if (!prev) return prev
      const idx = PROJECTS.findIndex((p) => p.id === prev.project.id)
      const nextIdx = dir === 'next' ? idx + 1 : idx - 1
      const nextProject = PROJECTS[nextIdx]
      if (!nextProject) return prev
      return { project: nextProject, rect: prev.rect }
    })
  }, [])

  const idx = detail ? PROJECTS.findIndex((p) => p.id === detail.project.id) : -1

  return (
    <main id="main" className="page">
      <Hero />
      <Stats />
      <WorkGrid onOpen={handleOpen} />
      <AboutTeaser />
      <CtaBand />

      {detail && (
        <Detail
          key={detail.project.id}
          project={detail.project}
          originRect={detail.rect}
          onClose={handleClose}
          onNav={handleNav}
          hasPrev={idx > 0}
          hasNext={idx < PROJECTS.length - 1}
        />
      )}
    </main>
  )
}
