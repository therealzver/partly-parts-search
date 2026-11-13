import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.jsx'

describe('App', () => {
  it('renders the Partly landing page', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Partly', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Auto parts search')).toBeInTheDocument()
  })
})
