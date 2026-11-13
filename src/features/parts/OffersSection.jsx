import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchOffers,
  selectArticle,
  selectSelectedManufacturer,
  selectOffers,
  selectOffersStatus,
} from './partsSlice.js'
import OffersTable from './OffersTable.jsx'

export default function OffersSection() {
  const dispatch = useDispatch()
  const article = useSelector(selectArticle)
  const brand = useSelector(selectSelectedManufacturer)
  const offers = useSelector(selectOffers)
  const status = useSelector(selectOffersStatus)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!article || !brand) return

    let cancelled = false
    let request
    // Let StrictMode's synchronous setup/cleanup replay finish before dispatching.
    queueMicrotask(() => {
      if (!cancelled) request = dispatch(fetchOffers({ article, brand }))
    })
    return () => {
      cancelled = true
      request?.abort()
    }
  }, [article, brand, dispatch, retry])

  return (
    <section className="surface mt-4 p-3 p-md-4" aria-labelledby="offers-heading">
      <h2 id="offers-heading" className="section-title">Аналоги и предложения</h2>
      {brand && <p>Производитель: <strong>{brand}</strong></p>}
      <div className="text-body-secondary" role="status" aria-live="polite">
        {status === 'idle' && <p className="text-body-secondary">Выберите производителя, чтобы увидеть предложения.</p>}
        {status === 'loading' && <p>
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          Загружаем предложения…
        </p>}
        {status === 'succeeded' && <p>{offers.length
          ? `Предложений найдено: ${offers.length}.`
          : 'Аналоги и предложения не найдены.'}</p>}
      </div>
      {status === 'failed' && <div role="alert" className="alert alert-danger">
        <p>Не удалось загрузить предложения. Попробуйте ещё раз.</p>
        <button type="button" className="btn btn-outline-danger" onClick={() => setRetry((value) => value + 1)}>
          Повторить запрос
        </button>
      </div>}
      {status === 'succeeded' && offers.length > 0 && <OffersTable offers={offers} />}
    </section>
  )
}
