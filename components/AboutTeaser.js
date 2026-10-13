import ProcessSteps from './ProcessSteps'

const BASE = process.env.NEXT_PUBLIC_BASEPATH || ''

export default function AboutTeaser() {
  return (
    <>
      <section id="lab" className="about-section">
        <div className="wrap">
          <h2>The Lab</h2>
          <p>
            Splatting moves fast. We stay ahead by testing it on real spaces, objects and moments,
            then turning what works into tools and spin-offs.
          </p>
          <p>
            We don&apos;t show up with a package. We sit down, ask questions, and find out together
            whether, where and how our tech can solve your problem. Some of those conversations have
            become confidential prototypes with partners. Got a hard visual problem? Let&apos;s
            explore it.
          </p>
          <a className="lab-cta" href={`${BASE}/contact/`}>
            Explore with us
            <img className="arrow" src={`${BASE}/assets/icon_arrow_r.png`} alt="" />
          </a>
        </div>
      </section>

      <section id="toolkit" className="about-section toolkit-section">
        <div className="wrap">
          <h2>Every project is different. Our toolkit isn&apos;t.</h2>
          <p>We mix and match, depending on what you&apos;re showing, who it&apos;s for and how fast you need it.</p>
          <ProcessSteps />
        </div>
      </section>
    </>
  )
}
