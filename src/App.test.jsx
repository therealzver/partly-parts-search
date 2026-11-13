import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.jsx'
import { Provider } from 'react-redux'
import { createAppStore } from './app/store.js'

describe('App', () => {
  it('renders the Partly landing page', () => {
    render(<Provider store={createAppStore()}><App /></Provider>)

    expect(screen.getByRole('heading', { name: 'Найдите нужную запчасть', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Поиск автозапчастей по артикулу')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toHaveTextContent('Partly')
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Демонстрационные данные')
    const input = screen.getByRole('textbox', { name: 'Артикул запчасти' })
    expect(input).toHaveAccessibleDescription(/Примеры артикулов: OC384/)
    input.focus()
    expect(input).toHaveFocus()
  })
})
