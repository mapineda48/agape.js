import content from 'i18n/content'
import './App.css'

function App() {
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
      </section>
    </main>
  )
}

export default App
