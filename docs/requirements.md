# Partly assignment requirements

Build an auto parts search frontend as a take-home assignment.

## Required stack

React with JavaScript (no TypeScript), Vite, Redux Toolkit, React Redux,
Bootstrap 5 with minimal custom CSS, Vitest, React Testing Library, ESLint,
and npm. Use Node 24.

## Functional requirements

1. Search manufacturers by an auto part article number.
2. Display matching manufacturers for selection.
3. Fetch alternative parts and offers for the article and selected manufacturer.
4. Display part name, manufacturer, price, and available stock.
5. Handle loading, empty responses, API failures, and stale requests.

Use a local mock API, introduced in milestone 2. No backend or real API is in scope.
Exact data contracts, fixtures, and mock behavior will be defined in milestone 2.

## Milestone 1 scope and acceptance

- Initialize the Vite React project and install required dependencies.
- Provide a minimal placeholder App, without search functionality.
- Configure `.gitignore`, `.nvmrc`, and package engines for Node 24.
- Provide npm lint, test, build, and verify scripts.
- Record mandatory rules, requirements, architecture, and nine incremental milestones.
- Add one basic App smoke test using React Testing Library and Vitest.
- Run `npm run verify`, which runs lint, tests, and production build in order.

Stop for review after milestone 1. Later milestones require explicit approval.
Never commit, push, or modify Git remotes.
