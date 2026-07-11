# How It Works

XRPL Memo Scanner is a static, backend-free web app. It talks directly from
your browser to public XRPL nodes over WebSockets — there's no server and no
database.

## The flow

1. **You pick a network** (`NetworkToggle`): XRPL Mainnet or Xahau Mainnet
   (`lib/networks.ts`). Xahau is a rippled-derived sidechain with the same
   `account_tx` RPC shape and address format, so the rest of the app works
   unchanged — only the endpoint list and explorer link differ. Your choice
   persists across reloads via `localStorage` and defaults to XRPL Mainnet.
2. **You enter an address** (`AddressInput`). It's validated locally
   (`lib/addressValidation.ts`) before anything is sent anywhere — the check
   is structural only and doesn't care which network is selected.
3. **The app connects to a node on the selected network**
   (`lib/xrplClient.ts`). It tries that network's public endpoints in order
   (XRPL: `xrplcluster.com`, `s1.ripple.com`, `s2.ripple.com`; Xahau:
   `xahau.network`, `xahau.org`) until one accepts the connection. If the
   connection drops mid-scan, it automatically reconnects to the next
   endpoint and resumes where it left off. Switching networks mid-flow
   cancels the current scan and clears results, since a result set only
   ever belongs to one network.
4. **It fetches the address's transaction history one page at a time**
   (`account_tx` requests), following the ledger's pagination `marker`. This
   is driven by `hooks/useScan.ts`, which:
   - pulls one page of transactions at a time,
   - filters out any transaction that has no `Memos`,
   - decodes the memos it finds (`lib/memoDecoder.ts` — hex-decodes each
     field, then detects if it's JSON, plain text, or unreadable binary),
   - streams results to the screen as each page arrives (you don't wait for
     the whole history to finish),
   - stops automatically after ~100 transactions as a safety cap, with a
     "Continue scanning" button to keep going from where it stopped.
5. **You browse the results** (`ResultsList` / `MemoCard`), and can narrow
   them with `FilterBar` (date range + free-text search) without re-scanning
   — filtering happens entirely client-side over what's already been found.
   Each result links out to that network's explorer
   (`livenet.xrpl.org` for XRPL, `xahauexplorer.com` for Xahau).

## Key files

| File | Responsibility |
|---|---|
| `src/lib/networks.ts` | Defines the XRPL/Xahau network configs (endpoints, explorer URL) and persists the selected network |
| `src/lib/xrplClient.ts` | Connects to a network's nodes, handles fallback/reconnect/rate-limit retries, fetches transaction pages |
| `src/lib/memoDecoder.ts` | Turns raw hex memo fields into readable text/JSON/raw |
| `src/lib/addressValidation.ts` | Checks an address is a valid classic or X-address (network-agnostic) |
| `src/hooks/useScan.ts` | Drives the whole scan: pagination loop, safety cap, cancellation |
| `src/App.tsx` | Wires the UI components to `useScan` and applies filters |
| `src/components/*` | Presentational pieces: network toggle, address form, status bar, filters, results, memo cards |

## Why no backend?

Everything exposed through `account_tx` is public ledger data on both XRPL
and Xahau — any node will answer the same query for anyone. Running it
client-side means no server to host, no API keys, and no data ever leaves
your browser.
