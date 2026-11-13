# Mandatory project rules

## Scope and stack

- Follow `docs/requirements.md` and `docs/implementation-plan.md`. Implement only
  the explicitly requested task or milestone; stop for review and never proceed
  to the next milestone without user approval.
- Use JavaScript only, React, Redux Toolkit with React Redux, Vite, Bootstrap 5
  with minimal custom CSS, Vitest, React Testing Library, ESLint, and npm. Use Node 24.
- Do not add a backend, real API integration, or additional state libraries.
  Introduce the local mock API in milestone 2, not milestone 1.
- Prefer simple components. Avoid unnecessary abstractions, overengineering,
  and premature optimization. Apply the boundaries below as approved milestones
  introduce behavior; do not scaffold future functionality to satisfy these rules.

## Architecture boundaries

- React components render UI and handle user interaction. Keep transient form
  input local; use React Redux to read shared state and dispatch actions.
- Redux Toolkit owns shared search state, selections, results, and request
  status/errors. Async thunks coordinate API calls; reducers remain pure.
- API services own mock fixtures, latency, and response/error contracts. They
  accept request inputs and cancellation signals, without rendering UI or
  accessing the Redux store. Components must not read fixtures directly.
- Keep business rules in reducers, selectors, or small pure functions where
  appropriate. Avoid duplicating them in components or adding a separate layer
  without a concrete need.

## Async request safety

- Handle loading, success, empty responses, and failures explicitly. Catch
  rejected requests and expose understandable errors; distinguish cancellation
  from an API failure.
- Use `AbortController`/`AbortSignal` to cancel obsolete requests when inputs
  change or their owning lifecycle ends. With `createAsyncThunk`, propagate
  `thunkAPI.signal` to the API service and use the dispatch promise's `abort()`.
  Mock services must honor cancellation and clean up timers/listeners.
- Cancellation alone is insufficient: guard fulfilled and rejected updates with
  the active request ID and current article/manufacturer inputs. Ignore stale
  responses, including errors, and reset dependent selections/results when
  their inputs change.

## Testing

- Add meaningful tests for new functionality and regression tests for bug fixes.
  Use Vitest and React Testing Library to test behavior rather than implementation
  details. Documentation-only changes do not require new tests.
- Cover relevant boundaries: invalid/empty input, no matches, API failures,
  cancellation, changed selections, and out-of-order responses as those flows
  are introduced. Keep async tests deterministic.
- Never delete, skip, weaken, or change tests merely to make them pass. Fix the
  underlying problem; update expectations only for an authorized behavior change.

## Git and user changes

- Never commit, push, or modify Git remotes.
- Preserve existing user changes. Never reset, discard, overwrite, or delete
  them; avoid destructive Git commands. If they conflict with the task, ask
  before proceeding with the conflicting edit.

## Definition of Done

- All requirements of the authorized task are implemented, without work from
  unapproved milestones. Relevant documentation and behavior tests are updated.
- Run `npm run verify` before declaring completion. Tests, ESLint, and the
  production build must all pass; do not bypass checks or hide failures.
- Review the changed files for scope and unintended edits. Report changed files,
  verification results, discovered problems, and remaining limitations. If checks
  fail or cannot run, report the blocker and do not claim completion.
- Stop and wait for review before further work.
