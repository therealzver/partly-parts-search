import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'
import { createAppStore } from './app/store.js'
import * as api from './services/mockApi.js'

async function advance(ms = 0) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms) })
}

function setup() {
  render(<StrictMode><Provider store={createAppStore()}><App /></Provider></StrictMode>)
  const input = screen.getByRole('textbox', { name: 'Артикул запчасти' })
  input.focus()
  return (value) => fireEvent.change(input, { target: { value } })
}

async function choose(brand) {
  const button = screen.getByRole('button', { name: brand })
  button.focus()
  fireEvent.click(button)
  await advance()
  return button
}

describe('App request regression flows', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(async () => {
    cleanup()
    // jsdom schedules a rendering tick to update focus after DOM removal.
    await advance(16)
    expect(vi.getTimerCount()).toBe(0)
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('clears loaded results on input changes and recovers from empty and failed searches', async () => {
    const enter = setup()
    enter('OC384')
    await advance(950)
    await choose('MAHLE')
    await advance(500)
    expect(screen.getByRole('table')).toBeInTheDocument()
    const input = screen.getByRole('textbox')
    input.focus()
    enter('unknown')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Производители' })).not.toBeInTheDocument()
    await advance(950)
    expect(screen.getByText('Производители не найдены. Проверьте артикул.')).toBeInTheDocument()
    expect(input).toHaveFocus()
    enter('NETWORK_ERROR')
    await advance(950)
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить производителей')
    expect(screen.queryByText(/Simulated network error/)).not.toBeInTheDocument()
    enter('C27009')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await advance(950)
    await choose('BOSCH')
    await advance(500)
    expect(screen.getByRole('table')).toHaveTextContent('Воздушный фильтр')
  })

  it.each(['resolve', 'reject'])('keeps the latest A selection loading after obsolete A/B requests %s', async (settle) => {
    const pending = []
    const getOffers = vi.spyOn(api, 'getOffers').mockImplementation(() => new Promise((resolve, reject) => {
      pending.push({ resolve, reject })
    }))
    const enter = setup()
    enter('OC384')
    await advance(950)
    await choose('MAHLE')
    await choose('MANN-FILTER')
    const currentButton = await choose('MAHLE')
    expect(getOffers).toHaveBeenCalledTimes(3)
    expect(getOffers.mock.calls.slice(0, 2).every((call) => call[2].signal.aborted)).toBe(true)
    await act(async () => {
      for (const request of pending.slice(0, 2)) {
        request[settle](settle === 'resolve' ? [{ id: 'old', name: 'Устаревшая деталь' }] : new Error('Old failure'))
      }
    })
    expect(screen.getByText('Загружаем предложения…')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(currentButton).toHaveAttribute('aria-pressed', 'true')
    expect(currentButton).toHaveFocus()
    await act(async () => pending[2].resolve([
      { id: 'current', name: 'Актуальная деталь', manufacturer: 'MAHLE', article: 'OC384', price: 1, currency: 'EUR', stock: 1 },
    ]))
    expect(screen.getByRole('table')).toHaveTextContent('Актуальная деталь')
    expect(screen.queryByText('Устаревшая деталь')).not.toBeInTheDocument()
    expect(currentButton).toHaveFocus()
    expect(getOffers).toHaveBeenCalledTimes(3)
  })

  it('cancels offers when typing a new article and makes no extra requests for focus or repeated selection', async () => {
    const manufacturers = vi.spyOn(api, 'getManufacturers')
    const offers = vi.spyOn(api, 'getOffers')
    const enter = setup()
    enter('OC384')
    await advance(950)
    const button = await choose('MAHLE')
    fireEvent.click(button)
    await advance()
    expect(offers).toHaveBeenCalledTimes(1)
    screen.getByRole('textbox').focus()
    enter('0986AF1234')
    expect(offers.mock.calls[0][2].signal.aborted).toBe(true)
    await advance(950)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    const group = screen.getByRole('group', { name: 'Производители' })
    expect(within(group).getByRole('button', { name: 'BOSCH' })).toHaveAttribute('aria-pressed', 'false')
    expect(manufacturers).toHaveBeenCalledTimes(2)
    expect(offers).toHaveBeenCalledTimes(1)
    for (const status of screen.getAllByRole('status')) expect(status).toHaveAttribute('aria-live', 'polite')
  })
})
