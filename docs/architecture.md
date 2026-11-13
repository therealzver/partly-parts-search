# Proposed architecture

Keep this a small client-side React application, built with Vite. Use Bootstrap 5
utility and component classes for layout and styling; add custom CSS only when
needed. No router, backend, or extra state library is planned.

## Current foundation

`index.html` mounts `src/main.jsx`, which imports Bootstrap CSS and renders
`src/App.jsx` in React StrictMode. App is a static placeholder. Vite and Vitest
share `vite.config.js`. The test setup provides DOM matchers and cleanup.
ESLint checks JavaScript and JSX, React hooks, and refresh compatibility.

Redux Toolkit and React Redux are installed for subsequent work. A store and
Provider will be introduced when the search flow first needs shared state.

## Current mock API (milestone 2)

`src/services/mockApi.js` exposes `getManufacturers` and `getOffers`, backed by
`src/services/mockFixtures.js`. Requests use a fixed 500 ms Promise delay, honor
AbortSignal, and return copies of demo data. A reserved article triggers a
controlled error. See `docs/api-contract.md` for the complete contract.
The service is not yet connected to Redux or the UI.

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

Use Vitest and React Testing Library for user-visible behavior. Later tests
should cover mock API contracts, async state transitions, failures, empty
responses, and out-of-order responses. The App smoke test confirms the placeholder renders. Mock API unit tests use
fake timers to cover data contracts, normalization, empty results, cancellation,
controlled failures, resource cleanup, and fixture isolation. `npm run verify` runs ESLint, tests once, and a Vite
production build; `npm run test:watch` supports local iteration.
