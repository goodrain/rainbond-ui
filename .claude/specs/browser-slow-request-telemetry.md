# Browser Slow Request Telemetry Spec

- Design doc: `docs/plans/2026-07-23-browser-slow-request-telemetry-design.md`
- Scope: `rainbond-ui`
- Goal: sample a small fraction of standard browser API calls and send only slow results as privacy-safe Sentry transactions.

## Execution Order

1. Add failing pure-function tests for sampling, eligibility, threshold, cancellation, page budget, trace mapping, and payload privacy.
2. Implement those helpers in `src/sentryConfig.js` and make the Node suite pass.
3. Add direct transaction transport while retaining the current error-event tunnel defaults.
4. Instrument the shared Axios lifecycle with pre-request sampling and idempotent completion.
5. Add explicit transfer opt-outs to model artifact and chunk upload callers.
6. Run the Node suites and production build.

## Transaction Contract

- Sample rate: `0.01` before timing.
- Slow threshold: strictly greater than `1000ms`.
- Page limit: `10` emission attempts in any rolling `60000ms` interval.
- Transaction name: `METHOD normalized-route`.
- Item type: `transaction`; operation: `http.client`.
- Direct browser-to-Sentry transport; no retry, persistence, or queue.
- Query strings and hosts are removed. Allowlisted static API segments remain,
  known resource values and unknown segments become placeholders, and unsafe
  malformed or encoded-separator paths are dropped.
- Only static component/source metadata, method, status, sample rate, release, timestamps, and trace IDs are emitted.

## Explicit Exclusions

- Axios cancellation.
- `/console/sentry` and `/console/posthog` requests.
- Requests whose options contain `skipSlowRequestTelemetry: true`.
- Direct fetch, streaming, upload, and download paths in this first version; callers using the shared wrapper can opt out explicitly.

## Commit

`feat: collect sampled browser slow requests`
