const BASE = process.env.NEXT_PUBLIC_BASEPATH || ''

export const metadata = {
  title: 'Barrierefreiheit — GoSPL',
}

export default function BarrierefreiheitPage() {
  return (
    <main id="main" lang="de" className="page page-offset">
      <div className="wrap">
        <div className="legal">
          <div className="kicker">Legal</div>
          <h1 className="legal-title">Barrierefreiheitserklärung</h1>
          <a className="legal-lang" href={`${BASE}/accessibility/`}>English version →</a>

          <div className="legal-body">
            <div className="legal-block">
              <p>
                GoSPL setzt sich dafür ein, gospl.io für möglichst viele Menschen nutzbar zu
                machen, einschließlich Menschen, die assistive Technologien verwenden, und die
                Anforderungen des Barrierefreiheitsstärkungsgesetzes (BFSG) sowie der zugrunde
                liegenden technischen Norm EN 301 549 (die WCAG 2.1 einbezieht) zu erfüllen.
              </p>

              <h2>Konformitätsstatus</h2>
              <p>
                Diese Website ist teilweise mit den Erfolgskriterien der Stufe AA der WCAG 2.1
                konform. &bdquo;Teilweise konform&ldquo; bedeutet, dass Teile der Inhalte die
                Barrierefreiheitsanforderungen noch nicht vollständig erfüllen, siehe unten.
              </p>

              <h2>Bekannte Einschränkungen</h2>
              <p>
                Die auf einzelnen Projektseiten eingebundenen interaktiven 3D-Touren werden auf
                einer separaten Subdomain (gospl.io Projekttouren) gehostet und liegen außerhalb
                des Quellcodes dieser Website. Sie wurden nicht separat auf WCAG-Konformität
                geprüft und sind möglicherweise nicht vollständig per Tastatur oder Screenreader
                bedienbar.
              </p>

              <h2>Rückmeldung und Kontakt</h2>
              <p>
                Wenn Sie auf dieser Website auf Barrieren stoßen oder Informationen in einem
                alternativen Format benötigen, kontaktieren Sie uns bitte:
              </p>
              <p>
                E-Mail: <a href="mailto:hannes@gospl.io">hannes@gospl.io</a>
              </p>
              <p>Wir sind bestrebt, auf Rückmeldungen zur Barrierefreiheit innerhalb angemessener Zeit zu antworten.</p>

              <h2>Durchsetzung</h2>
              <p>
                Wenn Sie mit unserer Antwort nicht zufrieden sind, können Sie sich an die für das
                BFSG zuständige Marktüberwachungsbehörde Ihres Bundeslandes wenden.
              </p>

              <p className="legal-updated">Stand: 24. August 2026.</p>
            </div>
          </div>

          <a className="legal-back" href={`${BASE}/`}>← Zurück zur Startseite</a>
        </div>
      </div>
    </main>
  )
}
