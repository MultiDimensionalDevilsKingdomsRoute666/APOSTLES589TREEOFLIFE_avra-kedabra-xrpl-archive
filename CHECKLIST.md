# XRPL Memo Scanner — Build Checklist

Simple static SPA that scans an XRPL address's transaction history and decodes any memos found. No backend, no database — direct browser-to-public-node connection.

## 1. Project Setup
- [x] Init Vite + React + TypeScript project
- [x] Install `xrpl` (xrpl.js official client library)
- [x] Set up folder structure:
  ```
  src/
  ├── main.tsx
  ├── App.tsx
  ├── components/
  │   ├── AddressInput.tsx
  │   ├── ConnectionStatus.tsx
  │   ├── FilterBar.tsx
  │   ├── ResultsList.tsx
  │   └── MemoCard.tsx
  ├── hooks/
  │   └── useScan.ts
  ├── lib/
  │   ├── xrplClient.ts
  │   ├── memoDecoder.ts
  │   ├── addressValidation.ts
  │   └── types.ts
  └── styles/
  ```
- [x] Define shared types in `lib/types.ts`: `ScanStatus`, `ScanProgress`, `MemoResult`, `ScanState`, `ResultFilter` (see design doc for shapes)

## 2. MemoDecoder — `lib/memoDecoder.ts` (build & test first — pure, no network)
- [x] `decodeMemo()`: hex-decode `MemoType` / `MemoFormat` / `MemoData`
- [x] Detect valid JSON in decoded `MemoData` → `kind: "json"`
- [x] Detect printable text → `kind: "text"`
- [x] Fallback to `kind: "raw"` with original hex when decode fails
- [x] Write unit tests: valid text memo, valid JSON memo, binary/garbage memo, missing fields

## 3. XrplClient & Address Validation — `lib/xrplClient.ts`, `lib/addressValidation.ts`
- [x] Wrap `xrpl.js` `Client` with a fallback endpoint list (`xrplcluster.com`, `s1.ripple.com`, `s2.ripple.com`)
- [x] `connect()`: try endpoints in order until one succeeds
- [x] `getAccountTxPage()`: call `account_tx` with `marker` + fixed `ledger_index_max`
- [x] Reconnect logic: on drop, switch to next fallback endpoint and resume from last `marker`
- [x] Backoff/retry on rate-limit or busy responses
- [x] Small inter-page delay to avoid hammering public nodes
- [x] `disconnect()` / abort method so an in-flight scan can be cancelled cleanly
- [x] `addressValidation.ts`: thin wrapper over `xrpl.js`'s `isValidClassicAddress` / `isValidXAddress` — don't hand-roll base58/checksum logic

## 4. Scan Flow — `hooks/useScan.ts`
- [x] `useScan()` hook: `{ state: ScanState; start(address); continueScanning(); reset(); }`
- [x] Drives the paginated fetch loop, filters txs with `Memos`, calls `MemoDecoder`
- [x] Enforce safety cap (~100 txs) → `status: "capped"`, resumes via `continueScanning()` from stored marker
- [x] Emit results incrementally so UI updates as pages arrive (don't block on full fetch)
- [x] Cancel/disconnect the in-flight scan on unmount or when `start()` is called again mid-scan

## 5. UI Components
- [x] `AddressInput`: `{ onSubmit(address), disabled? }` — validates format before calling `onSubmit`
- [x] `ConnectionStatus`: `{ status, progress }` — active endpoint, txs scanned / memos found
- [x] `FilterBar`: `{ onFilterChange(filter), disabled? }` — date range + free-text search
- [x] `ResultsList`: `{ results, explorerBaseUrl }` — tx date, hash, counterparty, memo(s), explorer link
- [x] `MemoCard`: `{ memo: DecodedMemo }` — renders json/text/raw appropriately
- [x] `App.tsx`: composes the above, holds `useScan()` + local `ResultFilter` state, derives filtered results via `useMemo`
- [x] Empty state: address with no memos
- [x] Error state: invalid address / all endpoints unreachable

## 6. Polish & Deploy
- [x] Handle addresses with zero transactions gracefully
- [x] Mobile-responsive basic layout
- [ ] Deploy as static site (Vercel/Netlify/GitHub Pages)
- [ ] Manual test against a few known addresses (e.g. a low-activity personal address and a high-volume exchange address) to confirm pagination and fallback actually work

## 7. Multi-Network Support (XRPL + Xahau) — requirements

Xahau is a rippled-derived sidechain: same `account_tx` RPC shape, same
classic-address format/checksum, so the existing client, decoder, and scan
loop should work unchanged once pointed at Xahau endpoints. The network
becomes a **selectable input** rather than a hardcoded constant.

**Confirmed decisions:**
- [x] Scope: XRPL Mainnet + Xahau Mainnet only (no testnets for now)
- [x] Switching networks always resets scan state (cancels in-flight scan, clears results + filters) — a result set only ever belongs to one network
- [x] Selected network persists across reloads via `localStorage`; defaults to XRPL Mainnet when unset
- [x] Xahau endpoint fallback list: `wss://xahau.network` (primary), `wss://xahau.org` (alias, some ad-blockers block `.network`) — network ID 21337
- [x] Xahau explorer base URL: `https://xahauexplorer.com/tx/` (note: path segment is `/tx/`, not XRPL's `/transactions/`)

**Functional requirements:**
- [x] Network config becomes data, not a constant: `{ id, label, endpoints[], explorerBaseUrl }` for `xrpl` and `xahau` (`lib/networks.ts`)
- [x] Toggle/switch component lets the user pick the active network before scanning (`NetworkToggle`, next to `AddressInput`)
- [x] `XrplClient` accepts an endpoint list per instance (already supported via `XrplClientOptions.endpoints`; `useScan.start()` now takes `endpoints` and passes the selected network's list)
- [x] `ResultsList`'s `explorerBaseUrl` prop is derived from the active network, not hardcoded in `App.tsx`
- [x] Active network stays visually unambiguous — `NetworkToggle` remains visible (disabled, not hidden) through every scan state
- [x] Toggle is disabled while `isBusy` (connecting/scanning); switching networks resets scan state (cancels in-flight scan, clears results/filters) and persists the choice to `localStorage`

**Non-functional:**
- [x] No new dependencies — same `xrpl.js` `Client` works against both networks (Xahau speaks the same WebSocket JSON-RPC protocol)
- [x] Stays backend-free and client-side only
- [x] Toggle doesn't break the existing mobile-responsive layout (wraps at narrow widths)

**Resolved questions:**
- [x] Toggle placement: next to `AddressInput`
- [x] Labels: "XRPL Mainnet / Xahau Mainnet"
- [x] X-address network-ID mismatch: accept regardless — `addressValidation.ts` stays structural-only, no per-network checksum check

## Open Decisions (confirm before/while building)
- [ ] Pick block explorer for tx links (Bithomp / XRPScan / livenet.xrpl.org)
- [ ] Confirm fallback endpoint list/order
- [x] Confirm safety cap default — set to 100 txs
- [ ] Styling approach: plain CSS/CSS modules (default) vs. Tailwind or another framework
