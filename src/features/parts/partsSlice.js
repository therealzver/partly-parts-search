import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getManufacturers, getOffers } from '../../services/mockApi.js'

export const fetchManufacturers = createAsyncThunk(
  'parts/fetchManufacturers',
  (article, { signal }) => getManufacturers(article, { signal }),
)

export const fetchOffers = createAsyncThunk(
  'parts/fetchOffers',
  ({ article, brand }, { signal }) => getOffers(article, brand, { signal }),
  {
    // An old UI callback must not start a request for an obsolete selection.
    condition: ({ article, brand }, { getState }) => {
      const parts = getState().parts
      return article === parts.article && brand === parts.selectedManufacturer && brand !== null
    },
  },
)

const initialState = {
  article: '',
  manufacturers: [],
  selectedManufacturer: null,
  offers: [],
  manufacturersStatus: 'idle',
  offersStatus: 'idle',
  manufacturersError: null,
  offersError: null,
  manufacturersRequestId: null,
  offersRequestId: null,
}

function resetOffers(state) {
  state.offers = []
  state.offersStatus = 'idle'
  state.offersError = null
  state.offersRequestId = null
}

function changeArticle(state, article) {
  if (state.article === article) return
  state.article = article
  state.manufacturers = []
  state.selectedManufacturer = null
  state.manufacturersStatus = 'idle'
  state.manufacturersError = null
  state.manufacturersRequestId = null
  resetOffers(state)
}

function isCurrentManufacturersRequest(state, action) {
  return state.manufacturersRequestId === action.meta.requestId
    && state.article === action.meta.arg
}

function isCurrentOffersRequest(state, action) {
  return state.offersRequestId === action.meta.requestId
    && state.article === action.meta.arg.article
    && state.selectedManufacturer === action.meta.arg.brand
}

const partsSlice = createSlice({
  name: 'parts',
  initialState,
  reducers: {
    articleChanged(state, action) {
      changeArticle(state, action.payload)
    },
    manufacturerSelected(state, action) {
      const brand = action.payload
      if (brand !== null && !state.manufacturers.includes(brand)) return
      if (state.selectedManufacturer === brand) return
      state.selectedManufacturer = brand
      resetOffers(state)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManufacturers.pending, (state, action) => {
        changeArticle(state, action.meta.arg)
        state.manufacturers = []
        state.manufacturersStatus = 'loading'
        state.manufacturersError = null
        state.manufacturersRequestId = action.meta.requestId
      })
      .addCase(fetchManufacturers.fulfilled, (state, action) => {
        if (!isCurrentManufacturersRequest(state, action)) return
        state.manufacturers = action.payload
        state.manufacturersStatus = 'succeeded'
        state.manufacturersRequestId = null
        if (!state.manufacturers.includes(state.selectedManufacturer)) {
          state.selectedManufacturer = null
          resetOffers(state)
        }
      })
      .addCase(fetchManufacturers.rejected, (state, action) => {
        if (!isCurrentManufacturersRequest(state, action)) return
        state.manufacturersStatus = action.meta.aborted ? 'idle' : 'failed'
        state.manufacturersError = action.meta.aborted ? null : action.error.message
        state.manufacturersRequestId = null
      })
      .addCase(fetchOffers.pending, (state, action) => {
        state.offers = []
        state.offersStatus = 'loading'
        state.offersError = null
        state.offersRequestId = action.meta.requestId
      })
      .addCase(fetchOffers.fulfilled, (state, action) => {
        if (!isCurrentOffersRequest(state, action)) return
        state.offers = action.payload
        state.offersStatus = 'succeeded'
        state.offersRequestId = null
      })
      .addCase(fetchOffers.rejected, (state, action) => {
        if (!isCurrentOffersRequest(state, action)) return
        state.offersStatus = action.meta.aborted ? 'idle' : 'failed'
        state.offersError = action.meta.aborted ? null : action.error.message
        state.offersRequestId = null
      })
  },
})

export const { articleChanged, manufacturerSelected } = partsSlice.actions
export default partsSlice.reducer

export const selectArticle = (state) => state.parts.article
export const selectManufacturers = (state) => state.parts.manufacturers
export const selectSelectedManufacturer = (state) => state.parts.selectedManufacturer
export const selectOffers = (state) => state.parts.offers
export const selectManufacturersStatus = (state) => state.parts.manufacturersStatus
export const selectOffersStatus = (state) => state.parts.offersStatus
export const selectManufacturersError = (state) => state.parts.manufacturersError
export const selectOffersError = (state) => state.parts.offersError
