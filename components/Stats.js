import { STATS } from '@/data/stats'

export default function Stats() {
  return (
    <section className="stats">
      <div className="wrap">
        <div className="stats-grid">
          {STATS.map((s) => (
            <div key={s.label} className="stat">
              <div className="n">{s.value}</div>
              <div className="l">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
