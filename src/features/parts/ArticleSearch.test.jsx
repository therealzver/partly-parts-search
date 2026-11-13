import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppStore } from '../../app/store.js'
import * as api from '../../services/mockApi.js'
import { articleChanged, fetchOffers } from './partsSlice.js'
import ArticleSearch from './ArticleSearch.jsx'

function setup(store = createAppStore()) {
  const view = render(<StrictMode><Provider store={store}><ArticleSearch /></Provider></StrictMode>)
  const enter = (value) => fireEvent.change(screen.getByRole('textbox', { name: 'Артикул запчасти' }), { target: { value } })
  return { ...view, store, enter }
}

async function advance(ms) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms) })
}

describe('Article search', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('keeps one debounce timer after StrictMode replay with a prefilled article', async () => {
    const search = vi.spyOn(api, 'getManufacturers')
    const store = createAppStore()
    store.dispatch(articleChanged('OC384'))
    const { unmount } = setup(store)

    expect(screen.getByRole('textbox')).toHaveValue('OC384')
    expect(vi.getTimerCount()).toBe(1)
    await advance(449)
    expect(search).not.toHaveBeenCalled()
    await advance(1)
    expect(search).toHaveBeenCalledExactlyOnceWith('OC384', { signal: expect.any(AbortSignal) })
    const signal = search.mock.calls[0][1].signal
    expect(signal.aborted).toBe(false)
    unmount()
    expect(signal.aborted).toBe(true)
    await advance(1000)
    expect(vi.getTimerCount()).toBe(0)
    expect(search).toHaveBeenCalledTimes(1)
    expect(store.getState().parts.manufacturersStatus).toBe('idle')
  })

  it('clears the prefilled StrictMode debounce on unmount before dispatch', async () => {
    const search = vi.spyOn(api, 'getManufacturers')
    const store = createAppStore()
    store.dispatch(articleChanged('OC384'))
    const { unmount } = setup(store)
    await advance(449)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
    await advance(1000)
    expect(search).not.toHaveBeenCalled()
  })

  it('preserves results and selection without refetching for equivalent edits', async () => {
    const search = vi.spyOn(api, 'getManufacturers')
    const { enter, store } = setup()
    enter('OC384')
    await advance(950)
    fireEvent.click(screen.getByRole('button', { name: 'MAHLE' }))
    const before = store.getState()
    for (const value of ['oc384', ' oc384 ', '  OC384  ']) {
      enter(value)
      expect(screen.getByRole('button', { name: 'MAHLE' })).toHaveAttribute('aria-pressed', 'true')
      await advance(1000)
      expect(store.getState()).toBe(before)
      expect(search).toHaveBeenCalledTimes(1)
    }
  })

  it('does not restart debounce or abort an active request for equivalent edits', async () => {
    const search = vi.spyOn(api, 'getManufacturers')
    const { enter } = setup()
    enter('OC384')
    await advance(300)
    enter(' oc384 ')
    await advance(150)
    expect(search).toHaveBeenCalledTimes(1)
    const signal = search.mock.calls[0][1].signal
    enter('oc384')
    expect(signal.aborted).toBe(false)
    await advance(1000)
    expect(search).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'MAHLE' })).toBeInTheDocument()
  })

  it('debounces edits for 450 ms and normalizes only outer whitespace and case', async () => {
    const search = vi.spyOn(api, 'getManufacturers')
    const { enter, store } = setup()
    enter(' oc')
    await advance(449)
    expect(search).not.toHaveBeenCalled()
    enter(' oc384 ')
    await advance(449)
    expect(search).not.toHaveBeenCalled()
    await advance(1)
    expect(search).toHaveBeenCalledExactlyOnceWith('OC384', { signal: expect.any(AbortSignal) })
    expect(screen.getByRole('textbox')).toHaveValue(' oc384 ')
    expect(store.getState().parts.article).toBe('OC384')
    expect(screen.getByRole('status')).toHaveTextContent('Ищем производителей')
    await advance(500)
    expect(screen.getByRole('button', { name: 'MAHLE' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'MANN-FILTER' })).toBeInTheDocument()
    enter(' a b-1 ')
    await advance(450)
    expect(search).toHaveBeenLastCalledWith('A B-1', { signal: expect.any(AbortSignal) })
  })

  it('does not request an empty or whitespace-only article', async () => {
    const search = vi.spyOn(api, 'getManufacturers')
    const { enter } = setup()
    await advance(1000)
    enter('   ')
    await advance(1000)
    expect(search).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent('Введите артикул')
  })

  it('selects a manufacturer without fetching offers, then immediately clears dependent state on an edit', async () => {
    const offers = vi.spyOn(api, 'getOffers')
    const { enter, store } = setup()
    enter('OC384')
    await advance(950)
    fireEvent.click(screen.getByRole('button', { name: 'MAHLE' }))
    expect(screen.getByRole('button', { name: 'MAHLE' })).toHaveAttribute('aria-pressed', 'true')
    expect(store.getState().parts.selectedManufacturer).toBe('MAHLE')
    expect(offers).not.toHaveBeenCalled()
    // Populate offers through the existing thunk to verify the input also clears them.
    act(() => { store.dispatch(fetchOffers({ article: 'OC384', brand: 'MAHLE' })) })
    await advance(500)
    expect(store.getState().parts.offers).toHaveLength(2)
    enter('C27009')
    expect(store.getState().parts.selectedManufacturer).toBeNull()
    expect(store.getState().parts.offers).toEqual([])
    expect(screen.queryByRole('button', { name: 'MAHLE' })).not.toBeInTheDocument()
  })

  it('shows empty results separately from failures and recovers after editing', async () => {
    const { enter } = setup()
    enter('unknown')
    await advance(950)
    expect(screen.getByRole('status')).toHaveTextContent('Производители не найдены')
    enter('NETWORK_ERROR')
    await advance(950)
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить производителей')
    expect(screen.getByRole('alert')).toHaveTextContent('Измените артикул')
    enter('OC384')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await advance(950)
    expect(screen.getByRole('button', { name: 'MAHLE' })).toBeInTheDocument()
  })

  it('aborts obsolete requests and displays only the latest results', async () => {
    const search = vi.spyOn(api, 'getManufacturers')
    const { enter } = setup()
    enter('NETWORK_ERROR')
    await advance(450)
    const firstSignal = search.mock.calls[0][1].signal
    enter('OC384')
    expect(firstSignal.aborted).toBe(true)
    await advance(950)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'MAHLE' })).toBeInTheDocument()
    expect(search).toHaveBeenCalledTimes(2)
  })

  it('cancels a pending debounce when cleared or unmounted', async () => {
    const search = vi.spyOn(api, 'getManufacturers')
    const { enter, unmount } = setup()
    enter('OC384')
    await advance(200)
    enter('')
    await advance(1000)
    expect(search).not.toHaveBeenCalled()
    enter('C27009')
    unmount()
    await advance(1000)
    expect(search).not.toHaveBeenCalled()
  })

  it('aborts the active request on unmount without surfacing an error', async () => {
    const search = vi.spyOn(api, 'getManufacturers')
    const { enter, unmount, store } = setup()
    enter('OC384')
    await advance(450)
    unmount()
    expect(search.mock.calls[0][1].signal.aborted).toBe(true)
    await advance(1000)
    expect(store.getState().parts.manufacturersStatus).toBe('idle')
    expect(store.getState().parts.manufacturersError).toBeNull()
    expect(store.getState().parts.manufacturers).toEqual([])
  })
})
