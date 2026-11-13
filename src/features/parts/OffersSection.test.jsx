import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppStore } from '../../app/store.js'
import * as api from '../../services/mockApi.js'
import { articleChanged, fetchManufacturers, manufacturerSelected } from './partsSlice.js'
import App from '../../App.jsx'
import OffersSection from './OffersSection.jsx'

async function advance(ms = 0) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms) })
}

async function setup({ selected = false } = {}) {
  const store = createAppStore()
  store.dispatch(articleChanged('OC384'))
  const request = store.dispatch(fetchManufacturers('OC384'))
  await vi.advanceTimersByTimeAsync(500)
  await request
  if (selected) store.dispatch(manufacturerSelected('MAHLE'))
  const view = render(<StrictMode><Provider store={store}><OffersSection /></Provider></StrictMode>)
  await advance()
  return { ...view, store }
}

async function select(store, brand) {
  await act(async () => { store.dispatch(manufacturerSelected(brand)) })
}

describe('Offers', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('does not request without an article or manufacturer', async () => {
    const getOffers = vi.spyOn(api, 'getOffers')
    render(<Provider store={createAppStore()}><OffersSection /></Provider>)
    await advance(1000)
    expect(screen.getByRole('status')).toHaveTextContent('Выберите производителя')
    expect(getOffers).not.toHaveBeenCalled()
  })

  it('loads offers from the manufacturer button using the normalized article', async () => {
    const getOffers = vi.spyOn(api, 'getOffers')
    render(<StrictMode><Provider store={createAppStore()}><App /></Provider></StrictMode>)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: ' oc384 ' } })
    await advance(950)
    fireEvent.click(screen.getByRole('button', { name: 'MAHLE' }))
    await advance()
    expect(getOffers).toHaveBeenCalledExactlyOnceWith('OC384', 'MAHLE', { signal: expect.any(AbortSignal) })
    expect(screen.getByText('Производитель:')).toHaveTextContent('MAHLE')
    expect(screen.getByText('Загружаем предложения…')).toBeInTheDocument()
    await advance(500)
    const table = screen.getByRole('table', { name: 'Доступные запчасти и предложения' })
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(3)
    expect(within(rows[1]).getAllByRole('cell').map((cell) => cell.textContent))
      .toEqual(['Масляный фильтр', 'MAHLE', 'OC384', new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'EUR' }).format(12.5), 'EUR', '24'])
    expect(within(rows[2]).getByText('W712/95')).toBeInTheDocument()
    expect(table.parentElement).toHaveClass('table-responsive')
    const scrollRegion = screen.getByRole('region', { name: 'Таблица предложений' })
    expect(scrollRegion).toHaveAttribute('tabindex', '0')
    scrollRegion.focus()
    expect(scrollRegion).toHaveFocus()
    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent))
      .toEqual(['Наименование', 'Производитель', 'Артикул', 'Цена', 'Валюта', 'Остаток, шт.'])
  })

  it('shows empty results', async () => {
    vi.spyOn(api, 'getOffers').mockResolvedValue([])
    const { store } = await setup()
    await select(store, 'MAHLE')
    expect(screen.getByRole('status')).toHaveTextContent('Аналоги и предложения не найдены')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('retries an offers failure independently of manufacturer errors', async () => {
    const technicalError = 'Simulated network error. Please try again.'
    const getOffers = vi.spyOn(api, 'getOffers').mockRejectedValueOnce(new Error(technicalError))
    const { store } = await setup()
    await select(store, 'MAHLE')
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить предложения')
    expect(screen.getByRole('alert')).toHaveTextContent('Попробуйте ещё раз.')
    expect(screen.queryByText(technicalError, { exact: false })).not.toBeInTheDocument()
    expect(store.getState().parts.manufacturersStatus).toBe('succeeded')
    fireEvent.click(screen.getByRole('button', { name: 'Повторить запрос' }))
    await advance()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Загружаем предложения')
    await advance(500)
    expect(getOffers).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('aborts on manufacturer change and ignores a late response even if the service ignores cancellation', async () => {
    let resolveOld
    const getOffers = vi.spyOn(api, 'getOffers').mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve }))
    const { store } = await setup()
    await select(store, 'MAHLE')
    const signal = getOffers.mock.calls[0][2].signal
    await select(store, 'MANN-FILTER')
    expect(signal.aborted).toBe(true)
    expect(store.getState().parts.offers).toEqual([])
    await advance(500)
    const current = store.getState().parts.offers
    await act(async () => { resolveOld([{ id: 'old', name: 'Obsolete part' }]) })
    expect(store.getState().parts.offers).toBe(current)
    expect(screen.queryByText('Obsolete part')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('immediately clears loaded offers when the manufacturer or article changes', async () => {
    const { store } = await setup({ selected: true })
    await advance(500)
    expect(screen.getByRole('table')).toBeInTheDocument()
    await select(store, 'MANN-FILTER')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    await advance(500)
    expect(screen.getByRole('table')).toBeInTheDocument()
    act(() => { store.dispatch(articleChanged('C27009')) })
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(store.getState().parts.offers).toEqual([])
    expect(screen.getByRole('status')).toHaveTextContent('Выберите производителя')
  })

  it('aborts an in-flight request when the article changes', async () => {
    const getOffers = vi.spyOn(api, 'getOffers')
    const { store } = await setup({ selected: true })
    act(() => { store.dispatch(articleChanged('C27009')) })
    expect(getOffers.mock.calls[0][2].signal.aborted).toBe(true)
    await advance(500)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('starts only one request on StrictMode replay and aborts it on unmount', async () => {
    const getOffers = vi.spyOn(api, 'getOffers')
    const { store, unmount } = await setup({ selected: true })
    expect(getOffers).toHaveBeenCalledTimes(1)
    const signal = getOffers.mock.calls[0][2].signal
    expect(signal.aborted).toBe(false)
    unmount()
    expect(signal.aborted).toBe(true)
    await advance(1000)
    expect(store.getState().parts.offersStatus).toBe('idle')
    expect(store.getState().parts.offersError).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('formats the supplied currency and displays zero stock', async () => {
    vi.spyOn(api, 'getOffers').mockResolvedValue([
      { id: 'usd', name: 'Filter', manufacturer: 'Brand', article: 'A1', price: 9, currency: 'USD', stock: 0 },
    ])
    await setup({ selected: true })
    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell')
    expect(cells.map((cell) => cell.textContent)).toEqual([
      'Filter', 'Brand', 'A1', new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'USD' }).format(9), 'USD', '0',
    ])
  })
})
