import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppStore } from '../../app/store.js'
import * as api from '../../services/mockApi.js'
import partsReducer, {
  articleChanged, manufacturerSelected, fetchManufacturers, fetchOffers,
  selectArticle, selectManufacturers, selectSelectedManufacturer, selectOffers,
  selectManufacturersStatus, selectOffersStatus, selectManufacturersError, selectOffersError,
} from './partsSlice.js'

async function complete(request) {
  await vi.advanceTimersByTimeAsync(500)
  return request
}

async function selectMahle(store) {
  await complete(store.dispatch(fetchManufacturers('OC384')))
  store.dispatch(manufacturerSelected('MAHLE'))
}

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

describe('parts state and thunks', () => {
  let store
  beforeEach(() => {
    vi.useFakeTimers()
    store = createAppStore()
  })
  afterEach(() => {
    vi.clearAllTimers()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('initializes an independent store with idle state and simple selectors', () => {
    expect(partsReducer(undefined, { type: 'unknown' })).toEqual({
      article: '', manufacturers: [], selectedManufacturer: null, offers: [],
      manufacturersStatus: 'idle', offersStatus: 'idle',
      manufacturersError: null, offersError: null,
      manufacturersRequestId: null, offersRequestId: null,
    })
    const state = store.getState()
    expect(selectArticle(state)).toBe('')
    expect(selectManufacturers(state)).toEqual([])
    expect(selectSelectedManufacturer(state)).toBeNull()
    expect(selectOffers(state)).toEqual([])
    expect(selectManufacturersStatus(state)).toBe('idle')
    expect(selectOffersStatus(state)).toBe('idle')
    expect(selectManufacturersError(state)).toBeNull()
    expect(selectOffersError(state)).toBeNull()
    store.dispatch(articleChanged('OC384'))
    expect(createAppStore().getState().parts.article).toBe('')
  })

  it('loads manufacturers using the API normalization without changing submitted input', async () => {
    const request = store.dispatch(fetchManufacturers(' oc384 '))
    expect(store.getState().parts).toMatchObject({
      article: ' oc384 ', manufacturersStatus: 'loading', manufacturersError: null,
      manufacturersRequestId: request.requestId, offersStatus: 'idle',
    })
    await complete(request)
    expect(store.getState().parts).toMatchObject({
      manufacturers: ['MAHLE', 'MANN-FILTER'], manufacturersStatus: 'succeeded',
      manufacturersRequestId: null,
    })
  })

  it('loads offers for the current article and selected manufacturer', async () => {
    await selectMahle(store)
    const request = store.dispatch(fetchOffers({ article: 'OC384', brand: 'MAHLE' }))
    expect(store.getState().parts).toMatchObject({ offersStatus: 'loading', manufacturersStatus: 'succeeded' })
    await complete(request)
    const state = store.getState().parts
    expect(state.offersStatus).toBe('succeeded')
    expect(state.offers).toHaveLength(2)
    expect(state.offers[0]).toMatchObject({ article: 'OC384', manufacturer: 'MAHLE' })
    expect(state.offersRequestId).toBeNull()
  })

  it('treats empty manufacturer results as successful', async () => {
    await complete(store.dispatch(fetchManufacturers('UNKNOWN')))
    expect(store.getState().parts).toMatchObject({
      manufacturers: [], manufacturersStatus: 'succeeded', manufacturersError: null,
    })
  })

  it('treats empty offers as successful and clears previous offers when retrying', async () => {
    await selectMahle(store)
    await complete(store.dispatch(fetchOffers({ article: 'OC384', brand: 'MAHLE' })))
    vi.spyOn(api, 'getOffers').mockResolvedValueOnce([])
    const request = store.dispatch(fetchOffers({ article: 'OC384', brand: 'MAHLE' }))
    expect(store.getState().parts).toMatchObject({ offers: [], offersStatus: 'loading' })
    await request
    expect(store.getState().parts).toMatchObject({
      offers: [], offersStatus: 'succeeded', offersError: null,
    })
  })

  it('handles manufacturer failure and clears its error on retry', async () => {
    await complete(store.dispatch(fetchManufacturers('NETWORK_ERROR')))
    expect(store.getState().parts).toMatchObject({
      manufacturersStatus: 'failed', manufacturersError: 'Simulated network error. Please try again.',
      manufacturersRequestId: null, offersError: null, offersStatus: 'idle',
    })
    const retry = store.dispatch(fetchManufacturers('OC384'))
    expect(store.getState().parts.manufacturersError).toBeNull()
    await complete(retry)
    expect(store.getState().parts.manufacturersStatus).toBe('succeeded')
  })

  it('handles offers failure independently and clears its error on retry', async () => {
    await selectMahle(store)
    vi.spyOn(api, 'getOffers').mockRejectedValueOnce(new Error('Offers unavailable'))
    await store.dispatch(fetchOffers({ article: 'OC384', brand: 'MAHLE' }))
    expect(store.getState().parts).toMatchObject({
      offersStatus: 'failed', offersError: 'Offers unavailable', offersRequestId: null,
      manufacturersStatus: 'succeeded', manufacturersError: null,
    })
    const retry = store.dispatch(fetchOffers({ article: 'OC384', brand: 'MAHLE' }))
    expect(store.getState().parts.offersError).toBeNull()
    await complete(retry)
    expect(store.getState().parts.offersStatus).toBe('succeeded')
  })

  it('clears all dependent data immediately when the article changes', async () => {
    await selectMahle(store)
    await complete(store.dispatch(fetchOffers({ article: 'OC384', brand: 'MAHLE' })))
    store.dispatch(articleChanged('C27009'))
    expect(store.getState().parts).toEqual({
      article: 'C27009', manufacturers: [], selectedManufacturer: null, offers: [],
      manufacturersStatus: 'idle', offersStatus: 'idle',
      manufacturersError: null, offersError: null,
      manufacturersRequestId: null, offersRequestId: null,
    })
  })

  it('also resets dependent data when a search directly submits a new article', async () => {
    await selectMahle(store)
    const offers = store.dispatch(fetchOffers({ article: 'OC384', brand: 'MAHLE' }))
    const search = store.dispatch(fetchManufacturers('C27009'))
    expect(store.getState().parts).toMatchObject({
      article: 'C27009', manufacturers: [], selectedManufacturer: null,
      offers: [], offersStatus: 'idle', offersRequestId: null,
    })
    await complete(Promise.all([offers, search]))
    expect(store.getState().parts.offers).toEqual([])
  })

  it('clears offers on changing or clearing the manufacturer and ignores invalid selections', async () => {
    await selectMahle(store)
    await complete(store.dispatch(fetchOffers({ article: 'OC384', brand: 'MAHLE' })))
    store.dispatch(manufacturerSelected('UNKNOWN'))
    expect(store.getState().parts.selectedManufacturer).toBe('MAHLE')
    store.dispatch(manufacturerSelected('MANN-FILTER'))
    expect(store.getState().parts).toMatchObject({
      selectedManufacturer: 'MANN-FILTER', offers: [], offersStatus: 'idle', offersError: null,
    })
    store.dispatch(manufacturerSelected(null))
    expect(store.getState().parts.selectedManufacturer).toBeNull()
  })

  it('preserves results when unchanged inputs are selected again', async () => {
    await selectMahle(store)
    await complete(store.dispatch(fetchOffers({ article: 'OC384', brand: 'MAHLE' })))
    const before = store.getState()
    store.dispatch(articleChanged('OC384'))
    store.dispatch(manufacturerSelected('MAHLE'))
    expect(store.getState()).toBe(before)
  })

  it('does not start offers requests for obsolete inputs or absent selection', async () => {
    const spy = vi.spyOn(api, 'getOffers')
    await store.dispatch(fetchOffers({ article: '', brand: null }))
    await selectMahle(store)
    await store.dispatch(fetchOffers({ article: 'C27009', brand: 'MAHLE' }))
    await store.dispatch(fetchOffers({ article: 'OC384', brand: 'BOSCH' }))
    expect(spy).not.toHaveBeenCalled()
    expect(store.getState().parts.offersStatus).toBe('idle')
  })

  it.each(['manufacturers', 'offers'])('aborts %s requests without recording a failure', async (kind) => {
    if (kind === 'offers') await selectMahle(store)
    const method = kind === 'offers' ? 'getOffers' : 'getManufacturers'
    const spy = vi.spyOn(api, method)
    const request = store.dispatch(kind === 'offers'
      ? fetchOffers({ article: 'OC384', brand: 'MAHLE' })
      : fetchManufacturers('OC384'))
    expect(spy.mock.calls[0].at(-1).signal).toBeInstanceOf(AbortSignal)
    request.abort()
    const result = await request
    expect(result.meta.aborted).toBe(true)
    expect(spy.mock.calls[0].at(-1).signal.aborted).toBe(true)
    expect(store.getState().parts[`${kind}Status`]).toBe('idle')
    expect(store.getState().parts[`${kind}Error`]).toBeNull()
    expect(store.getState().parts[`${kind}RequestId`]).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('maintains independent loading states for simultaneous requests', async () => {
    await selectMahle(store)
    const manufacturers = store.dispatch(fetchManufacturers('OC384'))
    const offers = store.dispatch(fetchOffers({ article: 'OC384', brand: 'MAHLE' }))
    expect(store.getState().parts).toMatchObject({ manufacturersStatus: 'loading', offersStatus: 'loading' })
    manufacturers.abort()
    await manufacturers
    expect(store.getState().parts).toMatchObject({ manufacturersStatus: 'idle', offersStatus: 'loading' })
    await complete(offers)
    expect(store.getState().parts).toMatchObject({ manufacturersStatus: 'idle', offersStatus: 'succeeded' })
  })

  it.each(['resolve', 'reject'])('ignores late manufacturer %s for the same article', async (settle) => {
    const old = deferred()
    vi.spyOn(api, 'getManufacturers').mockReturnValueOnce(old.promise)
    const first = store.dispatch(fetchManufacturers('OC384'))
    await complete(store.dispatch(fetchManufacturers('OC384')))
    const before = store.getState()
    old[settle](settle === 'resolve' ? ['STALE'] : new Error('Stale error'))
    await first
    expect(store.getState()).toBe(before)
  })

  it('does not let cancellation of an old request clear a newer loading state', async () => {
    const first = store.dispatch(fetchManufacturers('OC384'))
    const second = store.dispatch(fetchManufacturers('C27009'))
    first.abort()
    await first
    expect(store.getState().parts).toMatchObject({
      article: 'C27009', manufacturersStatus: 'loading',
      manufacturersRequestId: second.requestId, manufacturersError: null,
    })
    await complete(second)
    expect(store.getState().parts.manufacturers).toEqual(['MANN-FILTER', 'BOSCH'])
  })

  it('ignores an old article response even when the article changes back', async () => {
    const old = deferred()
    vi.spyOn(api, 'getManufacturers').mockReturnValueOnce(old.promise)
    const first = store.dispatch(fetchManufacturers('OC384'))
    await complete(store.dispatch(fetchManufacturers('C27009')))
    store.dispatch(articleChanged('OC384'))
    old.resolve(['STALE'])
    await first
    expect(store.getState().parts).toMatchObject({ manufacturers: [], manufacturersStatus: 'idle' })
  })

  it.each(['resolve', 'reject'])('ignores late offers %s after a newer request completes', async (settle) => {
    await selectMahle(store)
    const old = deferred()
    vi.spyOn(api, 'getOffers').mockReturnValueOnce(old.promise)
    const args = { article: 'OC384', brand: 'MAHLE' }
    const first = store.dispatch(fetchOffers(args))
    await complete(store.dispatch(fetchOffers(args)))
    const before = store.getState()
    old[settle](settle === 'resolve' ? [{ id: 'stale' }] : new Error('Stale error'))
    await first
    expect(store.getState()).toBe(before)
  })

  it.each(['resolve', 'reject'])('ignores offers %s after switching manufacturer away and back', async (settle) => {
    await selectMahle(store)
    const old = deferred()
    vi.spyOn(api, 'getOffers').mockReturnValueOnce(old.promise)
    const first = store.dispatch(fetchOffers({ article: 'OC384', brand: 'MAHLE' }))
    store.dispatch(manufacturerSelected('MANN-FILTER'))
    store.dispatch(manufacturerSelected('MAHLE'))
    old[settle](settle === 'resolve' ? [{ id: 'stale' }] : new Error('Stale error'))
    await first
    expect(store.getState().parts).toMatchObject({ offers: [], offersStatus: 'idle', offersError: null })
  })

  it('clears an invalidated selection after a manufacturer refresh', async () => {
    await selectMahle(store)
    const offers = store.dispatch(fetchOffers({ article: 'OC384', brand: 'MAHLE' }))
    vi.spyOn(api, 'getManufacturers').mockResolvedValueOnce([])
    await store.dispatch(fetchManufacturers('OC384'))
    await complete(offers)
    expect(store.getState().parts).toMatchObject({
      selectedManufacturer: null, offers: [], offersStatus: 'idle', manufacturersStatus: 'succeeded',
    })
  })
})
