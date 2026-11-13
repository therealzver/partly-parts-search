# Mock API contract (Milestone 02)

Import named methods from `src/services/mockApi.js`. Fixtures live separately in
`src/services/mockFixtures.js`. The service makes no HTTP requests and has no
backend, Redux, or UI dependencies. Redux thunks call it on behalf of the UI. Both methods return Promises with a fixed 500 ms simulated latency
(within the required 300–800 ms range); normal requests never fail randomly.
Options can be omitted. When supplied, `signal` must be an AbortSignal.

## Manufacturers

`getManufacturers(article, { signal } = {}) → Promise<string[]>`

The article is trimmed and converted to uppercase. Internal whitespace and
punctuation are preserved. Empty or non-string article inputs produce no matches.

```js
await getManufacturers(' oc384 ')
// ['MAHLE', 'MANN-FILTER']
```

The returned strings are manufacturer names usable as the `brand` argument below.
Available demo articles: `OC384` (oil filter), `0986AF1234` (air filter), and
`C27009` (air filter). Each has two manufacturers and two offers per manufacturer.

## Offers and alternatives

`getOffers(article, brand, { signal } = {}) → Promise<Offer[]>`

Both article and brand are trimmed and converted to uppercase. Brand is the
selected lookup manufacturer, while each offer describes an original part or an
illustrative alternative and can have a different article/manufacturer.

```js
await getOffers('OC384', 'MAHLE')
// [
//   { id: 'oc384-mahle-1', article: 'OC384', name: 'Масляный фильтр',
//     manufacturer: 'MAHLE', price: 12.5, currency: 'EUR', stock: 24 },
//   { id: 'oc384-mahle-2', article: 'W712/95', name: 'Масляный фильтр',
//     manufacturer: 'MANN-FILTER', price: 14.9, currency: 'EUR', stock: 8 }
// ]
```

| Field | Format |
| --- | --- |
| `id` | Unique string offer ID across all fixtures |
| `article` | String article of the offered part |
| `name` | String part name |
| `manufacturer` | String manufacturer of the offered part |
| `price` | Non-negative finite number, per unit in major currency units |
| `currency` | ISO currency code string; all fixtures use `EUR` |
| `stock` | Non-negative integer; zero means out of stock |

Every successful call returns a new array. Offer objects are copied so callers
can modify responses without changing fixtures or subsequent responses.

## Empty responses

Unknown articles resolve to `[]` in both methods. Unknown article/brand
combinations and empty/non-string brands resolve to `[]` in `getOffers`.
Empty results retain the same simulated latency and are not errors.

## Cancellation

```js
const controller = new AbortController()
const request = getManufacturers('OC384', { signal: controller.signal })
controller.abort()
try {
  await request
} catch (error) {
  // error.name === 'AbortError'
}
```

An already aborted signal rejects immediately without scheduling a timer.
An in-flight abort clears its timer and removes the listener. Both reject with a
DOMException named `AbortError`, message `Request aborted`, regardless of a custom
signal reason. Successful and failed requests also remove their abort listeners.
Aborting after settlement has no effect. Cancellation takes priority over the
error sentinel if it occurs before settlement. Callers must handle rejections.

## Controlled errors

Pass the reserved article `NETWORK_ERROR` to either method (with any brand for
`getOffers`). After normalization and 500 ms it rejects with a standard `Error`
whose message is `Simulated network error. Please try again.` This is an explicit
demo trigger, the sole exception to unknown articles returning `[]`. It does not
change subsequent requests or require global switches. An abort before settlement
rejects with `AbortError` instead.

## Limitations

All names, cross-references, prices, and availability are demonstration data;
brand names resemble real manufacturers, but compatibility is not verified.
Do not use these fixtures for purchasing or fitment decisions. There is no
persistence, pagination, supplier metadata, currency conversion, or real network
failure detection. Timing is fixed, though runtime scheduling can delay callbacks.
Requests are independent: Redux reducers guard state against out-of-order
responses using request IDs and current inputs; the service does not decide
which request is current.
