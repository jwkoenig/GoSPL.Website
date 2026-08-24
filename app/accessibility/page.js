const BASE = process.env.NEXT_PUBLIC_BASEPATH || ''

export const metadata = {
  title: 'Accessibility — GoSPL',
}

export default function AccessibilityPage() {
  return (
    <main id="main" className="page page-offset">
      <div className="wrap">
        <div className="legal">
          <div className="kicker">Legal</div>
          <h1 className="legal-title">Accessibility statement</h1>
          <a className="legal-lang" href={`${BASE}/barrierefreiheit/`}>Deutsche Version →</a>

          <div className="legal-body">
            <div className="legal-block">
              <p>
                GoSPL is committed to making gospl.io usable by as many people as possible,
                including people using assistive technology, and to meeting the requirements of
                the German Barrierefreiheitsstärkungsgesetz (BFSG) and the technical standard it
                references, EN 301 549 (which incorporates WCAG 2.1).
              </p>

              <h2>Conformance status</h2>
              <p>
                This website is partially conformant with WCAG 2.1 level AA. &ldquo;Partially
                conformant&rdquo; means that some parts of the content do not yet fully meet the
                accessibility standard, as listed below.
              </p>

              <h2>Known limitations</h2>
              <p>
                The interactive 3D project tours embedded on individual project pages are hosted
                on a separate subdomain (gospl.io project tours) and are outside the codebase of
                this website. They have not been separately audited against WCAG and may not be
                fully operable by keyboard or screen reader.
              </p>

              <h2>Feedback and contact</h2>
              <p>
                If you experience any accessibility barriers on this site, or need information in
                an alternative format, please get in touch:
              </p>
              <p>
                Email: <a href="mailto:hannes@gospl.io">hannes@gospl.io</a>
                <br />
                Phone: <a href="tel:+491792925060">+49 1792925060</a>
              </p>
              <p>We aim to respond to accessibility feedback within a reasonable time.</p>

              <h2>Enforcement</h2>
              <p>
                If you are not satisfied with our response, you may raise the matter with the
                market surveillance authority responsible for the BFSG in your federal state.
              </p>

              <p className="legal-updated">Last updated: 24 August 2026.</p>
            </div>
          </div>

          <a className="legal-back" href={`${BASE}/`}>← Back to home</a>
        </div>
      </div>
    </main>
  )
}
