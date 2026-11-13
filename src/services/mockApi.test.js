import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getManufacturers, getOffers } from './mockApi.js'
import { mockCatalog } from './mockFixtures.js'

const methods = [
  ['getManufacturers', (article, options) => getManufacturers(article, options)],
  ['getOffers', (article, options) => getOffers(article, 'MAHLE', options)],
]

async function finish(request) {
  await vi.advanceTimersByTimeAsync(500)
  return request
}

describe('mock API', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('returns manufacturers after the simulated delay', async () => {
    const settled = vi.fn()
    const request = getManufacturers('OC384')
    void request.then(settled)

    await vi.advanceTimersByTimeAsync(499)
    expect(settled).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(await request).toEqual(['MAHLE', 'MANN-FILTER'])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('returns original and alternative offers for an article and manufacturer', async () => {
    const offers = await finish(getOffers('OC384', 'MAHLE'))
    expect(offers).toEqual([
      { id: 'oc384-mahle-1', article: 'OC384', name: 'Oil filter', manufacturer: 'MAHLE', price: 12.5, currency: 'EUR', stock: 24 },
      { id: 'oc384-mahle-2', article: 'W712/95', name: 'Oil filter', manufacturer: 'MANN-FILTER', price: 14.9, currency: 'EUR', stock: 8 },
    ])
  })

  it('normalizes article and brand whitespace and case', async () => {
    expect(await finish(getManufacturers('  oc384  '))).toEqual(['MAHLE', 'MANN-FILTER'])
    expect(await finish(getOffers('  oc384  ', ' mahle ')))
      .toEqual(await finish(getOffers('OC384', 'MAHLE')))
  })

  it.each(['UNKNOWN', '', '   ', null, undefined, 'toString', '__proto__'])(
    'returns empty arrays for an unknown or invalid article: %s', async (article) => {
      expect(await finish(getManufacturers(article))).toEqual([])
      expect(await finish(getOffers(article, 'MAHLE'))).toEqual([])
    },
  )

  it.each(['UNKNOWN', '', null, 'toString', '__proto__'])(
    'returns no offers for an unknown or invalid brand: %s', async (brand) => {
      expect(await finish(getOffers('OC384', brand))).toEqual([])
    },
  )

  describe.each(methods)('%s request lifecycle', (_name, invoke) => {
    it('cancels an in-flight request and cleans up resources', async () => {
      const controller = new AbortController()
      const removeListener = vi.spyOn(controller.signal, 'removeEventListener')
      const request = invoke('OC384', { signal: controller.signal })
      const assertion = expect(request).rejects.toMatchObject({ name: 'AbortError' })
      await vi.advanceTimersByTimeAsync(200)
      controller.abort()
      await assertion
      expect(vi.getTimerCount()).toBe(0)
      expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function))
    })

    it('rejects an already aborted signal without scheduling work', async () => {
      const controller = new AbortController()
      controller.abort()
      await expect(invoke('OC384', { signal: controller.signal }))
        .rejects.toMatchObject({ name: 'AbortError' })
      expect(vi.getTimerCount()).toBe(0)
    })

    it('simulates a controlled network failure and permits later success', async () => {
      const assertion = expect(invoke(' network_error '))
        .rejects.toThrow('Simulated network error. Please try again.')
      await vi.advanceTimersByTimeAsync(500)
      await assertion
      expect(await finish(invoke('OC384'))).not.toHaveLength(0)
    })

    it('removes the abort listener after success and failure', async () => {
      const controller = new AbortController()
      const removeListener = vi.spyOn(controller.signal, 'removeEventListener')
      await finish(invoke('OC384', { signal: controller.signal }))
      expect(removeListener).toHaveBeenCalledTimes(1)
      const assertion = expect(invoke('NETWORK_ERROR', { signal: controller.signal }))
        .rejects.toThrow('Simulated network error')
      await vi.advanceTimersByTimeAsync(500)
      await assertion
      expect(removeListener).toHaveBeenCalledTimes(2)
      controller.abort()
      expect(vi.getTimerCount()).toBe(0)
    })

    it('prioritizes pre-aborted signals over simulated errors', async () => {
      const controller = new AbortController()
      controller.abort()
      await expect(invoke('NETWORK_ERROR', { signal: controller.signal }))
        .rejects.toMatchObject({ name: 'AbortError' })
    })
  })

  it('keeps concurrent requests independent when one is cancelled', async () => {
    const controller = new AbortController()
    const assertion = expect(getManufacturers('OC384', { signal: controller.signal }))
      .rejects.toMatchObject({ name: 'AbortError' })
    const other = getManufacturers('C27009')
    controller.abort()
    await assertion
    expect(await finish(other)).toEqual(['MANN-FILTER', 'BOSCH'])
  })

  it('provides multiple brands and offers for every demo article with valid fields', async () => {
    const ids = new Set()
    for (const article of ['OC384', '0986AF1234', 'C27009']) {
      const brands = await finish(getManufacturers(article))
      expect(brands.length).toBeGreaterThanOrEqual(2)
      for (const brand of brands) {
        const offers = await finish(getOffers(article, brand))
        expect(offers.length).toBeGreaterThanOrEqual(2)
        expect(offers.some((offer) => offer.manufacturer !== brand)).toBe(true)
        for (const offer of offers) {
          for (const field of ['id', 'article', 'name', 'manufacturer', 'currency']) {
            expect(typeof offer[field]).toBe('string')
            expect(offer[field].length).toBeGreaterThan(0)
          }
          expect(Number.isFinite(offer.price)).toBe(true)
          expect(offer.price).toBeGreaterThanOrEqual(0)
          expect(Number.isInteger(offer.stock)).toBe(true)
          expect(offer.stock).toBeGreaterThanOrEqual(0)
          expect(offer.currency).toBe('EUR')
          expect(ids.has(offer.id)).toBe(false)
          ids.add(offer.id)
        }
      }
    }
  })

  it('does not mutate fixtures or share mutable results between calls', async () => {
    const snapshot = structuredClone(mockCatalog)
    for (const [article, brands] of Object.entries(snapshot)) {
      const manufacturers = await finish(getManufacturers(article))
      manufacturers.splice(0, manufacturers.length, 'CHANGED')
      expect(await finish(getManufacturers(article))).toEqual(Object.keys(brands))
      for (const [brand, expectedOffers] of Object.entries(brands)) {
        const offers = await finish(getOffers(article, brand))
        offers[0].name = 'Changed'
        offers[0].price = -1
        offers.pop()
        expect(await finish(getOffers(article, brand))).toEqual(expectedOffers)
      }
    }
    expect(mockCatalog).toEqual(snapshot)
  })
})
