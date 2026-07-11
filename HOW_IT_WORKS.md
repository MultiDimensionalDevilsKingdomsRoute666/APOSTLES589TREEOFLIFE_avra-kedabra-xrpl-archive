# How It Works

XRPL Memo Scanner is a static, backend-free web app. It talks directly from
your browser to public XRPL nodes over WebSockets — there's no server and no
database.

## The flow

1. **You enter an address** (`AddressInput`). It's validated locally
   (`lib/addressValidation.ts`) before anything is sent anywhere.
2. **The app connects to an XRPL node** (`lib/xrplClient.ts`). It tries a
   list of public endpoints (`xrplcluster.com`, `s1.ripple.com`,
   `s2.ripple.com`) in order until one accepts the connection. If the
   connection drops mid-scan, it automatically reconnects to the next
   endpoint and resumes where it left off.
3. **It fetches the address's transaction history one page at a time**
   (`account_tx` requests), following XRPL's pagination `marker`. This is
   driven by `hooks/useScan.ts`, which:
   - pulls one page of transactions at a time,
   - filters out any transaction that has no `Memos`,
   - decodes the memos it finds (`lib/memoDecoder.ts` — hex-decodes each
     field, then detects if it's JSON, plain text, or unreadable binary),
   - streams results to the screen as each page arrives (you don't wait for
     the whole history to finish),
   - stops automatically after ~100 transactions as a safety cap, with a
     "Continue scanning" button to keep going from where it stopped.
4. **You browse the results** (`ResultsList` / `MemoCard`), and can narrow
   them with `FilterBar` (date range + free-text search) without re-scanning
   — filtering happens entirely client-side over what's already been found.

## Key files

| File | Responsibility |
|---|---|
| `src/lib/xrplClient.ts` | Connects to XRPL nodes, handles fallback/reconnect/rate-limit retries, fetches transaction pages |
| `src/lib/memoDecoder.ts` | Turns raw hex memo fields into readable text/JSON/raw |
| `src/lib/addressValidation.ts` | Checks an address is a valid XRPL classic or X-address |
| `src/hooks/useScan.ts` | Drives the whole scan: pagination loop, safety cap, cancellation |
| `src/App.tsx` | Wires the UI components to `useScan` and applies filters |
| `src/components/*` | Presentational pieces: address form, status bar, filters, results, memo cards |

## Why no backend?

Everything XRPL exposes through `account_tx` is public ledger data — any
node will answer the same query for anyone. Running it client-side means no
server to host, no API keys, and no data ever leaves your browser.
