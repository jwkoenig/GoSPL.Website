const BASE = process.env.NEXT_PUBLIC_BASEPATH || ''

export const metadata = {
  title: 'Imprint — GoSPL',
}

export default function ImprintPage() {
  return (
    <main id="main" className="page page-offset">
      <div className="wrap">
        <div className="legal">
          <div className="kicker">Legal</div>
          <h1 className="legal-title">Imprint</h1>
          <a className="legal-lang" href={`${BASE}/impressum/`}>Deutsche Version →</a>

          <div className="legal-body">
            <div className="legal-block">

					<p>Werbegrafik K&ouml;nig<br />
					Johannes Wolfgang K&ouml;nig<br />
					GoSPL.io<br />
					Mauerstr 23<br />
					10117 Berlin, Germany</p>

					<h2>Contact</h2>
					<p>Email: <a href="mailto:studio@gospl.io">studio@gospl.io</a></p>

					<h2>Responsible for editorial content</h2>
					<p>Johannes Wolfgang K&ouml;nig</p>

					<h2>Design + UX</h2>
					<p><a href="https://polinasogo.myportfolio.com/projects" target="_blank">Polina Sogolov</a></p>

					<h2>Web Development</h2>
					<p>Johannes Wolfgang K&ouml;nig</p>

					<h2>VAT ID</h2>
					<p>VAT identification number pursuant to Section 27a of the German VAT Act (Umsatzsteuergesetz):<br />
					DE359776964</p>

					<h2>Consumer dispute resolution / universal arbitration board</h2>
					<p>We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.</p>

            </div>
          </div>

          <a className="legal-contact" href={`${BASE}/contact/`}>Get in touch via our contact form →</a>
        </div>
      </div>
    </main>
  )
}
