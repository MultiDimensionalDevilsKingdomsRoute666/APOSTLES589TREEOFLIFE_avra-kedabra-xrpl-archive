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

## Open Decisions (confirm before/while building)
- [ ] Pick block explorer for tx links (Bithomp / XRPScan / livenet.xrpl.org)
- [ ] Confirm fallback endpoint list/order
- [x] Confirm safety cap default — set to 100 txs
- [ ] Styling approach: plain CSS/CSS modules (default) vs. Tailwind or another framework
