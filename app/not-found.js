const BASE = process.env.NEXT_PUBLIC_BASEPATH || ''

export const metadata = {
  title: '404 — GoSPL',
}

export default function NotFound() {
  return (
    <main className="page page-offset">
      <div className="wrap">
        <div className="legal">
          <div className="kicker">404</div>
          <h1 className="legal-title">Page not found</h1>
          <p style={{ marginTop: 24, fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2)' }}>
            The page you're looking for doesn't exist or has moved.
          </p>
          <a className="legal-back" href={`${BASE}/`}>← Back to home</a>
        </div>
      </div>
    </main>
  )
}
