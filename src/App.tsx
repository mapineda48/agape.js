import content from 'i18n/content'
import './App.css'

const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Espanol' },
  { code: 'pt', label: 'Portugues' },
  { code: 'fr', label: 'Francais' },
  { code: 'de', label: 'Deutsch' },
]

function setPreferredLocale(locale: string) {
  const maxAgeSeconds = 60 * 60 * 24 * 365
  document.cookie = `preferred_locale=${locale}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`
  window.location.reload()
}

function App() {
  const showLocaleSwitcher = import.meta.env.PROD

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">{content.badge}</p>
        <h1>{content.title}</h1>
        <p className="subtitle">{content.subtitle}</p>

        <div className="test-content">
          <p>{content.paragraphs[0]}</p>
          <p>{content.paragraphs[1]}</p>
        </div>

        <div className="meta-row">
          <span className="pill">{content.cta}</span>
          <span className="locale">Locale: {__LOCALE__}</span>
        </div>

        {showLocaleSwitcher ? (
          <div className="switcher-wrap">
            <label htmlFor="locale-select" className="switcher-label">
              Change language
            </label>
            <select
              id="locale-select"
              className="switcher-select"
              defaultValue={__LOCALE__}
              onChange={(event) => setPreferredLocale(event.target.value)}
            >
              {SUPPORTED_LOCALES.map((locale) => (
                <option key={locale.code} value={locale.code}>
                  {locale.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default App
