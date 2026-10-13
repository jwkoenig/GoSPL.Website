const BASE = process.env.NEXT_PUBLIC_BASEPATH || ''

export default function CtaBand() {
  return (
    <section className="cta-band">
      <div className="wrap">
        <h2>Got a space, object or moment worth exploring?</h2>
        <a className="btn" href={`${BASE}/contact/`}>
          Let&apos;s talk
          <img className="arrow" src={`${BASE}/assets/icon_arrow_r.png`} alt="" />
        </a>
      </div>
    </section>
  )
}
