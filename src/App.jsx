import ArticleSearch from './features/parts/ArticleSearch.jsx'
import OffersSection from './features/parts/OffersSection.jsx'

export default function App() {
  return (
    <main className="container py-5">
      <h1>Partly</h1>
      <p className="lead">Auto parts search</p>
      <ArticleSearch />
      <OffersSection />
    </main>
  )
}
