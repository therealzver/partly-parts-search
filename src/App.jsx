import ArticleSearch from './features/parts/ArticleSearch.jsx'
import OffersSection from './features/parts/OffersSection.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container py-4">
          <span className="wordmark">Partly<span aria-hidden="true">.</span></span>
          <p className="text-body-secondary mb-0 mt-1">Поиск автозапчастей по артикулу</p>
        </div>
      </header>
      <main className="container py-4 py-md-5" id="main-content">
        <div className="mb-4">
          <h1>Найдите нужную запчасть</h1>
          <p className="text-body-secondary mb-0">Введите артикул, выберите производителя и сравните предложения.</p>
        </div>
        <ArticleSearch />
        <OffersSection />
      </main>
    </div>
  )
}
