const BASE = process.env.NEXT_PUBLIC_BASEPATH || ''

export default function Footer() {
  return (
    <footer className="foot">
      <div className="foot-inner">
        <div className="foot-logo">
          <img src={`${BASE}/assets/logo/logo-white.svg`} alt="GoSPL" />
        </div>

        <div className="foot-cols">
          <div className="foot-col">
            <div className="h">Studio</div>
            <p>Mobile first, <br />capturing worldwide <br />and in cyberspace</p>
          </div>
          <div className="foot-col">
            <div className="h">Enquiries</div>
            <a href="mailto:studio@gospl.io">studio@gospl.io</a>
            <a href="tel:+49.1792925060">+49 1792925060</a>
          </div>
          <div className="foot-col">
            <div className="h">Elsewhere</div>
            <a href="https://instagram.com/gospl.io" target="_blank" rel="noreferrer">Instagram ↗</a>
            <a href="https://www.linkedin.com/company/therealgospl" target="_blank" rel="noreferrer">LinkedIn ↗</a>
          </div>
          <div className="foot-col">
            <div className="h">Legal</div>
            <a href={`${BASE}/imprint/`}>Imprint</a>
            <a href={`${BASE}/privacy-policy/`}>Privacy Policy</a>
            <a href={`${BASE}/accessibility/`}>Accessibility</a>
          </div>
        </div>

        <div className="foot-bottom">© {new Date().getFullYear()} GoSPL. All rights reserved.</div>
      </div>
    </footer>
  )
}
