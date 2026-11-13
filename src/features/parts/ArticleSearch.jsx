import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  articleChanged,
  fetchManufacturers,
  manufacturerSelected,
  selectArticle,
  selectManufacturers,
  selectManufacturersStatus,
  selectSelectedManufacturer,
} from './partsSlice.js'

export default function ArticleSearch() {
  const dispatch = useDispatch()
  const article = useSelector(selectArticle)
  const [input, setInput] = useState(article)
  const normalizedArticle = input.trim().toUpperCase()
  const manufacturers = useSelector(selectManufacturers)
  const status = useSelector(selectManufacturersStatus)
  const selected = useSelector(selectSelectedManufacturer)

  useEffect(() => {
    if (!normalizedArticle) return

    let request
    const timer = setTimeout(() => {
      request = dispatch(fetchManufacturers(normalizedArticle))
    }, 450)

    return () => {
      clearTimeout(timer)
      request?.abort()
    }
  }, [normalizedArticle, dispatch])

  function handleChange(event) {
    const value = event.target.value
    setInput(value)
    dispatch(articleChanged(value.trim().toUpperCase()))
  }

  return (
    <section className="surface p-3 p-md-4" aria-label="Поиск по артикулу">
      <div className="search-content">
        <h2 className="section-title mb-3">Поиск по артикулу</h2>
        <label className="form-label fw-semibold" htmlFor="article">Артикул запчасти</label>
        <input
          id="article"
          className="form-control form-control-lg"
          type="text"
          placeholder="Например, OC384"
          autoComplete="off"
          aria-describedby="article-help"
          spellCheck={false}
          value={input}
          onChange={handleChange}
        />
        <p id="article-help" className="form-text">
          Примеры артикулов: OC384, 0986AF1234 или C27009. Поиск начнётся автоматически.
        </p>
        <div className="search-feedback text-body-secondary" role="status" aria-live="polite">
          {status === 'idle' && <p className="text-body-secondary">
            {article ? 'Ожидаем завершения ввода…' : 'Введите артикул, чтобы начать поиск.'}
          </p>}
          {status === 'loading' && <p><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Ищем производителей…</p>}
          {status === 'succeeded' && <p>
            {manufacturers.length ? 'Выберите производителя.' : 'Производители не найдены. Проверьте артикул.'}
          </p>}
        </div>
        {status === 'failed' && <p role="alert" className="alert alert-danger">
          Не удалось загрузить производителей. Измените артикул, чтобы повторить поиск.
        </p>}
        {status === 'succeeded' && manufacturers.length > 0 && (
          <div role="group" aria-label="Производители" className="d-flex flex-wrap gap-2">
            {manufacturers.map((brand) => (
              <button
                key={brand}
                type="button"
                className={`btn manufacturer-button ${selected === brand ? 'btn-primary' : 'btn-outline-primary'}`}
                aria-pressed={selected === brand}
                onClick={() => dispatch(manufacturerSelected(brand))}
              >
                {brand}
                {selected === brand && <span className="ms-2" aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
