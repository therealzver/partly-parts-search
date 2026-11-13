# Incremental implementation plan

Each milestone requires explicit approval before implementation. Complete and
verify only the requested milestone, then stop for review. Run `npm run verify`
at every handoff and report changes, results, and limitations.

## Approved milestone 04 scope clarification

The milestone 04 task explicitly includes displaying and selecting manufacturers,
which the original sequence below assigned to milestone 5. Milestone 04 therefore
covers the article input, 450 ms debounce, normalization, immediate dependent-state
reset, manufacturer feedback and selection, request cancellation, and UI tests.
Selecting a manufacturer only updates Redux. The alternatives/offers table and
its UI request integration are deferred to milestone 05 per the current task;
no offers requests or table are added in milestone 04. This clarification takes
precedence over the original milestone labels below.

## Approved milestone 05 scope clarification

The milestone 05 task explicitly authorizes fetching alternatives/offers on
manufacturer selection, a responsive offers table, all offers request states,
retry, cancellation, stale response protection, and StrictMode tests. This takes
precedence over the original labels below, which assigned offers to milestone 6.
Milestone 05 builds on manufacturer selection already delivered in milestone 04.
No sorting, filtering, or pagination is included.

## Approved milestone 06 scope clarification

Milestone 06 is UI/UX polish and Russian UI localization, overriding the original
labels below. It covers a light Bootstrap-based layout, responsive search and
manufacturer controls, accessible offer presentation, Russian feedback and
ru-RU prices using API currencies. Only fixture part names are translated; API
behavior, Redux, debounce and request lifecycles stay unchanged. Technical docs
remain in English. Milestone 07 and subsequent work require separate approval.

1. **Foundation and harness:** Initialize Vite/React, install the stack,
   configure Node and npm scripts, add mandatory rules and project docs, and
   verify a minimal placeholder with one smoke test.
2. **Mock API:** Define article/manufacturer/part/offer contracts, local fixtures,
   async mock methods, deterministic loading/empty/error scenarios, and contract
   tests. Do not integrate a real API.
3. **Search state:** Add the Redux Toolkit store, React Redux Provider, search
   slice, and manufacturer search thunk with focused reducer/thunk tests.
4. **Article search UI:** Add an accessible article number form, basic input
   validation, and manufacturer search loading/error/empty feedback.
5. **Manufacturer selection:** Display matching manufacturers, support selection,
   and reset dependent state when the submitted article changes.
6. **Alternatives and offers:** Fetch by submitted article and selected
   manufacturer, store results, and display part name, manufacturer, price, and
   available stock.
7. **Request resilience:** Complete stale-request guards, dependent-state resets,
   retry behavior, and loading/empty/failure handling throughout the flow. Test
   out-of-order responses and selection changes.
8. **UI and accessibility polish:** Review responsive Bootstrap layout, labels,
   keyboard navigation, focus handling, status announcements, and price/stock
   presentation. Keep custom CSS minimal.
9. **Final validation and handoff:** Complete end-to-end user-flow integration
   coverage with React Testing Library, check edge cases, update run instructions
   and architecture docs, and report final verification and known limitations.

## Approved milestone 07 scope clarification

Milestone 07 covers comprehensive regression testing, request races, Redux state
consistency, integration flows, and a code review of localization, accessibility,
and performance. Add missing tests without duplicating existing coverage; fix
only reproduced defects with minimal changes. No new product behavior, broad
refactoring, dependencies, sorting, filtering, or pagination. See
`docs/milestone-07-review.md` for coverage and review limitations. Stop for code
review after verification; milestone 08 requires separate approval.

## Approved milestone 08 scope clarification

Milestone 08 covers a Russian reviewer-facing README, GitHub Actions CI for push
and pull requests to `main` using Node.js 24, npm caching, `npm ci`, and
`npm run verify`, plus reproducibility and documentation checks. This overrides
the original milestone 8 label above; UI polish was delivered in milestone 06.
Business logic, Redux, Mock API, UI, and package versions remain unchanged.
Stop for code review after verification. Milestone 09 is reserved for separately
approved GitHub Pages deployment; no deployment is included in milestone 08.

## Approved milestone 09 scope clarification

Milestone 09 configures production deployment to GitHub Pages at
`https://therealzver.github.io/partly-parts-search/`: Vite base path, an official
GitHub Actions deployment workflow with Node.js 24 and verification before
publication, production asset path checks, and deployment documentation.
Existing CI, application behavior, dependencies, Redux, and Mock API stay unchanged.
No commit, push, remote changes, or live publication are performed during setup.
Stop for final code review after local verification.
