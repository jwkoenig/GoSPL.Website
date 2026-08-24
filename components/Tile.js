'use client'

import { forwardRef } from 'react'

const Tile = forwardRef(function Tile({ project, onOpen }, ref) {
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onOpen(project, rect)
  }

  return (
    <button ref={ref} type="button" className="tile" onClick={handleClick}>
      <img className="tile-img" src={project.img} alt={project.title} />
      <div className="tile-veil" />
      <div className="tile-info">
        <div className="tile-type">{project.type}</div>
        <div className="tile-title">{project.title}</div>
      </div>
    </button>
  )
})

export default Tile
