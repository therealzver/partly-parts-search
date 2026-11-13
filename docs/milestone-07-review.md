# Milestone 07 regression review

Starting point: clean `main`, Node 24.22.2, 73 passing tests. The resulting suite
contains 87 tests across six files. Production code and dependencies are unchanged.

## Added coverage

`src/features/parts/partsSlice.test.js` adds ten parameterized checks covering both
request types. Old successes, failures, and cancellations must preserve a newer
loading state, request ID, and error. Old successes must also preserve a newer
failure. Pre-aborted external thunk signals must schedule no service work or state
changes. Controlled promises test reducer guards independently of UI cancellation.

`src/App.integration.test.jsx` adds four full-App checks under StrictMode:

- Loaded offers disappear immediately on article edits; unknown and error articles
  show distinct Russian feedback, and a valid edit restores the complete flow.
- A → B → A with obsolete successes or failures keeps the latest selection loading
  until its response arrives. Selection and focus survive loading and completion.
- Typing during offers loading aborts the old request. Focus changes and selecting
  the same manufacturer again do not issue additional requests.

Existing suites already cover debounce boundaries and rapid typing, normalized
input identity, empty offers, offers retry, API cancellation before execution and
during latency, listener cleanup, unmount, StrictMode replay, semantic table
headers, currency/zero stock, and request races after newer success. They remain
intact. Tests use local services, fake timers, isolated stores, and restored spies;
no network or wall-clock waits are required. The new integration teardown drains
jsdom's 16 ms focus rendering tick and asserts that no timers remain.

## Code review findings

No application defect was reproduced. Request ID and input guards, dependent
resets, separate statuses/errors, and abort propagation remain appropriate for
this application. No redundant shared state or new actions are needed.

Visible UI feedback is Russian; technical API errors remain in Redux and are not
rendered directly. Inputs have labels/help text; native buttons expose selection
with aria-pressed. Status regions are polite and errors use alerts. Table headers
have column scope and the scrolling region is named and focusable. Focus is
checked on the input and manufacturer buttons across relevant asynchronous
transitions. The existing reduced-motion CSS disables animations/transitions.

Effects have bounded dependencies and cancel their timers/requests. StrictMode
replay does not issue duplicate service requests. Input normalization is small;
formatting runs only for displayed offers. No expensive input-time calculations,
unbounded effects, persistent subscriptions, or missing service listener cleanup
were found. Memoization is not warranted by this review.

## Limitations

RTL/jsdom checks DOM semantics and programmatic focus, not actual browser Tab,
Enter/Space navigation, screen-reader announcements, visual layout, or computed
reduced-motion behavior. Those still require manual browser/assistive technology
review. Performance findings are static analysis, not profiling. The API remains
local, deterministic demonstration data; no real-network behavior is validated.

## Verification results

`npm run verify` passed: ESLint with zero warnings, all 87 tests, and the Vite
production build. Two additional `npm test` runs and a shuffled run with seed 707
also passed all 87 tests. `git diff --check` passed. Reviewed changes are limited
to the two test files, this report, and the milestone scope clarification.
No commits or pushes were made; milestone 08 has not started.
