'use client'

import { useEffect, useRef } from 'react'
import { PROJECTS } from '@/data/projects'
import Tile from './Tile'

export default function WorkGrid({ onOpen }) {
  const nodesRef = useRef([])

  useEffect(() => {
    const nodes = nodesRef.current.filter(Boolean)
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  return (
    <section id="work" className="work-section">
      <div className="wrap">
        <div className="work-head">
          <h2>Selected work</h2>
          <p>
            We create interactive digital twins to explore interactively online.
            <br />
            No App. No Pixelstreaming. No Plugin. No BS
          </p>
        </div>

        <div className="grid-work">
          {PROJECTS.map((project, i) => (
            <Tile
              key={project.id}
              ref={(el) => (nodesRef.current[i] = el)}
              project={project}
              onOpen={onOpen}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
