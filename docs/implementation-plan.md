# Incremental implementation plan

Each milestone requires explicit approval before implementation. Complete and
verify only the requested milestone, then stop for review. Run `npm run verify`
at every handoff and report changes, results, and limitations.

1. **Foundation and harness (current):** Initialize Vite/React, install the stack,
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
