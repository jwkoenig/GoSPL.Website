const BASE = process.env.NEXT_PUBLIC_BASEPATH || ''

export const metadata = {
  title: 'Impressum — GoSPL',
}

export default function ImpressumPage() {
  return (
    <main id="main" lang="de" className="page page-offset">
      <div className="wrap">
        <div className="legal">
          <div className="kicker">Legal</div>
          <h1 className="legal-title">Impressum</h1>
          <a className="legal-lang" href={`${BASE}/imprint/`}>English version →</a>

          <div className="legal-body">
            <div className="legal-block">

					<p>Johannes Wolfgang K&ouml;nig<br />
					GoSPL.io<br />
					Mauerstr 23<br />
					10117 Berlin</p>

					<h2>Kontakt</h2>
					<p>Telefon: +49 1792925060<br />
					E-Mail: <a href="mailto:hannes@gospl.io">hannes@gospl.io</a></p>

					<h2>Umsatzsteuer-ID</h2>
					<p>Umsatzsteuer-Identifikationsnummer gem&auml;&szlig; &sect; 27 a Umsatzsteuergesetz:<br />
					DE359776964</p>

					<h2>Redaktionell verantwortlich</h2>
					<p>Johannes Wolfgang K&ouml;nig</p>

					<h2>Verbraucher&shy;streit&shy;beilegung/Universal&shy;schlichtungs&shy;stelle</h2>
					<p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>

            </div>
          </div>

          <a className="legal-back" href={`${BASE}/`}>← Back to home</a>
        </div>
      </div>
    </main>
  )
}
