import { mockCatalog } from './mockFixtures.js'

/**
 * @typedef {Object} Offer
 * @property {string} id Unique demo offer ID.
 * @property {string} article Offered part's article (may differ from the lookup).
 * @property {string} name
 * @property {string} manufacturer Offered part's manufacturer.
 * @property {number} price Price per unit in major currency units.
 * @property {string} currency ISO currency code.
 * @property {number} stock Non-negative integer quantity.
 */

const RESPONSE_DELAY_MS = 500

function normalize(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

function simulateRequest(article, signal, getResult) {
  return new Promise((resolve, reject) => {
    const abortError = () => new DOMException('Request aborted', 'AbortError')

    if (signal?.aborted) {
      reject(abortError())
      return
    }

    const onAbort = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', onAbort)
      reject(abortError())
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)

      if (article === 'NETWORK_ERROR') {
        reject(new Error('Simulated network error. Please try again.'))
        return
      }

      resolve(getResult())
    }, RESPONSE_DELAY_MS)

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function findManufacturers(article) {
  return Object.hasOwn(mockCatalog, article) ? mockCatalog[article] : {}
}

/**
 * @param {string} article Trimmed and uppercased before lookup.
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<string[]>} Matching manufacturer names; a fresh array.
 */
export function getManufacturers(article, { signal } = {}) {
  const normalizedArticle = normalize(article)
  return simulateRequest(normalizedArticle, signal, () => (
    Object.keys(findManufacturers(normalizedArticle))
  ))
}

/**
 * @param {string} article Lookup article, not necessarily the offered part's article.
 * @param {string} brand Manufacturer name returned by getManufacturers.
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Offer[]>} Original/alternative offers; fresh objects and array.
 */
export function getOffers(article, brand, { signal } = {}) {
  const normalizedArticle = normalize(article)
  const normalizedBrand = normalize(brand)
  return simulateRequest(normalizedArticle, signal, () => {
    const manufacturers = findManufacturers(normalizedArticle)
    const offers = Object.hasOwn(manufacturers, normalizedBrand)
      ? manufacturers[normalizedBrand]
      : []
    return offers.map((offer) => ({ ...offer }))
  })
}
