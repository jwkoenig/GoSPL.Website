import { LOCATIONS } from '@/data/team'

export default function Locations() {
  return (
    <div className="locations-block">
      <h3 className="about-sub">Where to find us</h3>
      <div className="locations">
        {LOCATIONS.map((loc) => (
          <div key={loc.id} className="location">
            <div className="location-label">{loc.label}</div>
            <h4>{loc.name}</h4>
            <div className="location-place">{loc.place}</div>
            <p>{loc.body}</p>
            <a href={loc.url} target="_blank" rel="noopener noreferrer">
              {loc.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')} ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
