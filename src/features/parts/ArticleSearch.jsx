import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  articleChanged,
  fetchManufacturers,
  manufacturerSelected,
  selectArticle,
  selectManufacturers,
  selectManufacturersError,
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
  const error = useSelector(selectManufacturersError)
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
    <section className="row g-4" aria-label="Article search">
      <div className="col-12 col-md-8 col-lg-6">
        <label className="form-label" htmlFor="article">Article number</label>
        <input
          id="article"
          className="form-control"
          type="text"
          placeholder="e.g. OC384"
          autoComplete="off"
          aria-describedby="article-help"
          value={input}
          onChange={handleChange}
        />
        <p id="article-help" className="form-text">
          Enter an article number to find manufacturers. Try OC384, 0986AF1234, or C27009.
        </p>
        <div role="status" aria-live="polite">
          {status === 'idle' && <p className="text-body-secondary">
            {article ? 'Waiting for input to finish…' : 'Enter an article number to start.'}
          </p>}
          {status === 'loading' && <p>Searching manufacturers…</p>}
          {status === 'succeeded' && <p>
            {manufacturers.length ? 'Choose a manufacturer.' : 'No manufacturers found. Check the article number.'}
          </p>}
        </div>
        {status === 'failed' && <p role="alert" className="alert alert-danger">
          Could not load manufacturers. {error} Edit the article number to search again.
        </p>}
        {status === 'succeeded' && manufacturers.length > 0 && (
          <div role="group" aria-label="Manufacturers" className="d-flex flex-wrap gap-2">
            {manufacturers.map((brand) => (
              <button
                key={brand}
                type="button"
                className={`btn ${selected === brand ? 'btn-primary' : 'btn-outline-primary'}`}
                aria-pressed={selected === brand}
                onClick={() => dispatch(manufacturerSelected(brand))}
              >
                {brand}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
