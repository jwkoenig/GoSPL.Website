const BASE = process.env.NEXT_PUBLIC_BASEPATH || ''

export default function CtaBand() {
  return (
    <section className="cta-band">
      <div className="wrap">
        <h2>Have a space to showcase?</h2>
        <a className="btn" href={`${BASE}/contact/`}>
          Contact us
          <img className="arrow" src={`${BASE}/assets/icon_arrow_r.png`} alt="" />
        </a>
      </div>
    </section>
  )
}
