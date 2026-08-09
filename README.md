# XRPL Memo Scanner

A browser-based tool for scanning an XRPL (XRP Ledger) address's transaction
history and decoding any memos attached to those transactions.

Enter an XRPL address, and the app streams in its past transactions,
extracts any `Memos` fields, decodes them from hex into readable text/JSON,
and lets you filter the results by date or search text. The scanner itself
is entirely client-side — no backend, no database, no API keys — and talks
directly to public XRPL nodes over WebSockets.

## Getting started

```
npm install
npm run dev
```

Then open the printed URL (usually http://localhost:5173). This runs the
scanner itself

## More details

- [HOW_IT_WORKS.md](./HOW_IT_WORKS.md) — architecture and data flow
- [RUNNING.md](./RUNNING.md) — running the app locally

## Tech stack

React + TypeScript, built with Vite, using the [`xrpl`](https://www.npmjs.com/package/xrpl) library to talk to the ledger.
