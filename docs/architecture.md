# Proposed architecture

Keep this a small client-side React application, built with Vite. Use Bootstrap 5
utility and component classes for layout and styling; add custom CSS only when
needed. No router, backend, or extra state library is planned.

## Current foundation

`index.html` mounts `src/main.jsx`, which imports Bootstrap CSS and renders
`src/App.jsx` in React StrictMode. App is a static placeholder. Vite and Vitest
share `vite.config.js`. The test setup provides DOM matchers and cleanup.
ESLint checks JavaScript and JSX, React hooks, and refresh compatibility.

`src/app/store.js` configures a single `parts` reducer and exports the application
store plus `createAppStore` for isolated tests. `src/main.jsx` wraps App in the
React Redux Provider. The placeholder UI does not initiate requests yet.

## Current mock API (milestone 2)

`src/services/mockApi.js` exposes `getManufacturers` and `getOffers`, backed by
`src/services/mockFixtures.js`. Requests use a fixed 500 ms Promise delay, honor
AbortSignal, and return copies of demo data. A reserved article triggers a
controlled error. See `docs/api-contract.md` for the complete contract.
Redux thunks call this service; the UI is not yet connected to search behavior.

## Current Redux state (milestone 3)

`src/features/parts/partsSlice.js` owns the submitted article, manufacturers,
selected manufacturer, offers, and separate status/error/request ID fields for
each request type. Statuses are `idle`, `loading`, `succeeded`, and `failed`.
Simple selectors expose UI data without memoization.

- `articleChanged(article)` clears dependent state when the article changes.
  The submitted value is stored as supplied; normalization remains in the API.
- `manufacturerSelected(brand)` accepts a loaded manufacturer or `null` to clear
  selection. Changing selection clears offers and invalidates their request ID.
- `fetchManufacturers(article)` starts a search, also updating the article and
  resetting dependent state if it changed. A refresh of the same article preserves
  the current selection/offers; a response that no longer contains the selected
  manufacturer clears them.
- `fetchOffers({ article, brand })` requires the exact current submitted article
  and selected manufacturer. Obsolete or absent selections are rejected by its
  thunk condition without making an API call. New offers requests clear old offers.
- Both thunks forward `thunkAPI.signal`. The dispatch promise exposes `abort()`;
  cancellation resets the active request to `idle` without a user-facing error.
  Other rejections produce `failed` and an error message. Empty arrays succeed.
- Both fulfilled and rejected reducers require the active request ID and matching
  current inputs. Changing inputs invalidates IDs immediately, so switching away
  and back cannot revive old results. No controllers or promises enter Redux state.
  Request cancellation belongs to callers: later UI lifecycle code should abort
  obsolete dispatch promises. State guards protect correctness even without abort.

## Proposed search flow for later milestones

- A small search form owns its editable article number locally.
- Redux Toolkit stores the submitted article, manufacturer results, selected
  manufacturer, alternative parts/offers, and request status/errors.
- Async thunks call a local mock API module. That module owns fixtures, simulated
  latency, and deterministic empty/error cases; components do not read fixtures.
- Selecting a manufacturer fetches alternatives and offers using the submitted
  article and manufacturer. Results show name, manufacturer, price, and stock.
- A new article clears dependent selection/results. Changing manufacturer clears
  dependent offers. Use thunk request IDs and current request inputs to ignore
  stale fulfilled/rejected actions. Cancellation may reduce obsolete work, but
  stale-response guards are still required.
- Render explicit idle, loading, success, empty, and failure states. Keep errors
  understandable and provide retry behavior when implemented.

Start with a search feature directory containing a slice and small components,
plus a separate mock API module. Extract additional modules only when concrete
behavior warrants them. Do not create these future modules in milestone 1.

## Verification

Use Vitest and React Testing Library for user-visible behavior. The App smoke
test confirms the placeholder renders. Mock API tests use fake timers to cover
data contracts, normalization, empty results, cancellation, controlled failures,
resource cleanup, and fixture isolation. Redux tests use isolated stores, the
mock API with fake timers, and controlled Promises for out-of-order responses.
They cover async transitions, independent statuses/errors, dependent resets,
cancellation, empty results, and stale fulfilled/rejected actions.
`npm run verify` runs ESLint, tests once, and a Vite production build;
`npm run test:watch` supports local iteration.
