import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.jsx'
import { Provider } from 'react-redux'
import { createAppStore } from './app/store.js'

describe('App', () => {
  it('renders the Partly landing page', () => {
    render(<Provider store={createAppStore()}><App /></Provider>)

    expect(screen.getByRole('heading', { name: 'Partly', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Auto parts search')).toBeInTheDocument()
  })
})
