import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchOffers,
  selectArticle,
  selectSelectedManufacturer,
  selectOffers,
  selectOffersStatus,
  selectOffersError,
} from './partsSlice.js'
import OffersTable from './OffersTable.jsx'

export default function OffersSection() {
  const dispatch = useDispatch()
  const article = useSelector(selectArticle)
  const brand = useSelector(selectSelectedManufacturer)
  const offers = useSelector(selectOffers)
  const status = useSelector(selectOffersStatus)
  const error = useSelector(selectOffersError)
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
    <section className="mt-4" aria-labelledby="offers-heading">
      <h2 id="offers-heading">Alternatives and offers</h2>
      {brand && <p>Selected manufacturer: <strong>{brand}</strong></p>}
      <div role="status" aria-live="polite">
        {status === 'idle' && <p className="text-body-secondary">Choose a manufacturer to see offers.</p>}
        {status === 'loading' && <p>
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          Loading offers…
        </p>}
        {status === 'succeeded' && <p>{offers.length
          ? `${offers.length} offers found.`
          : 'No alternatives or offers found.'}</p>}
      </div>
      {status === 'failed' && <div role="alert" className="alert alert-danger">
        <p>Could not load offers. {error}</p>
        <button type="button" className="btn btn-outline-danger" onClick={() => setRetry((value) => value + 1)}>
          Retry offers
        </button>
      </div>}
      {status === 'succeeded' && offers.length > 0 && <OffersTable offers={offers} />}
    </section>
  )
}
