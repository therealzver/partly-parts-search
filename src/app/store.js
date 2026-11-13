import { configureStore } from '@reduxjs/toolkit'
import partsReducer from '../features/parts/partsSlice.js'

export function createAppStore() {
  return configureStore({ reducer: { parts: partsReducer } })
}

export const store = createAppStore()
