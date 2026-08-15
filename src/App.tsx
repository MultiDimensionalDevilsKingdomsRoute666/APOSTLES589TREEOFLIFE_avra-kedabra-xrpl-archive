import { useMemo, useRef, useState } from "react";
import { AddressInput } from "./components/AddressInput";
import { BackToTop } from "./components/BackToTop";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { DonationModal } from "./components/DonationModal";
import { FilterBar } from "./components/FilterBar";
import { Logo } from "./components/Logo";
import { NetworkToggle } from "./components/NetworkToggle";
import { ResultsList, type NumberedMemoResult } from "./components/ResultsList";
import { SocialLinks } from "./components/SocialLinks";
import { useScan } from "./hooks/useScan";
import { NETWORKS, loadStoredNetworkId, storeNetworkId } from "./lib/networks";
import type { MemoResult, NetworkId, ResultFilter } from "./lib/types";
import "./App.css";

function matchesFilter(result: MemoResult, filter: ResultFilter): boolean {
  const day = result.date.slice(0, 10);
  if (filter.dateFrom && day < filter.dateFrom) return false;
  if (filter.dateTo && day > filter.dateTo) return false;

  if (filter.searchText) {
    const needle = filter.searchText.toLowerCase();
    const haystack = [
      result.txHash,
      result.counterparty ?? "",
      ...result.memos.flatMap((memo) => [
        memo.text ?? "",
        memo.type ?? "",
        memo.format ?? "",
        memo.rawHex,
      ]),
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(needle)) return false;
  }

  return true;
}

function FooterContact() {
  return (
    <div className="app-footer-contact">
      <SocialLinks />
    </div>
  );
}

function App() {
  const { state, start, continueScanning, reset } = useScan();
  const [filter, setFilter] = useState<ResultFilter>({});
  const [scanKey, setScanKey] = useState(0);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showUseCases, setShowUseCases] = useState(false);
  const [networkId, setNetworkId] = useState<NetworkId>(() => loadStoredNetworkId());
  const [showDonationModal, setShowDonationModal] = useState(false);
  const donationTriggerRef = useRef<HTMLButtonElement>(null);
  const network = NETWORKS[networkId];

  const numberedResults = useMemo<NumberedMemoResult[]>(
    () => state.results.map((result, index) => ({ ...result, refNumber: index + 1 })),
    [state.results],
  );

  const filteredResults = useMemo(
    () => numberedResults.filter((result) => matchesFilter(result, filter)),
    [numberedResults, filter],
  );

  const isBusy = state.status === "connecting" || state.status === "scanning";
  const hasRun = state.status !== "idle";
  const showResults =
    state.status === "scanning" || state.status === "capped" || state.status === "done";
  const isEmptyResult = state.status === "done" && state.results.length === 0;
  const hasNoTransactionHistory = isEmptyResult && state.progress.txsScanned === 0;

  function handleSubmit(address: string) {
    setFilter({});
    setScanKey((key) => key + 1);
    start(address, network.endpoints);
  }

  function handleReset() {
    setFilter({});
    setScanKey((key) => key + 1);
    reset();
  }

  function handleNetworkChange(id: NetworkId) {
    if (id === networkId) return;
    setNetworkId(id);
    storeNetworkId(id);
    setFilter({});
    setScanKey((key) => key + 1);
    reset();
  }

  return (
    <>
    <main className="app">
      <div className="app-title-row">
        <Logo className="app-logo" />
        <h1>XRPL MEMO SCANNER</h1>
      </div>
      <p className="app-subtitle">
        SCAN ANY XRPL ADDRESS'S TRANSACTION HISTORY AND DECODE MEMOS ATTACHED TO IT.
      </p>

      <div className="info-links">
        <button
          type="button"
          className="how-it-works-toggle"
          onClick={() => setShowHowItWorks((value) => !value)}
          aria-expanded={showHowItWorks}
        >
          [HOW IT WORKS]
          <span className="how-it-works-icon" aria-hidden="true">
            {showHowItWorks ? "▲" : "▼"}
          </span>
        </button>

        <button
          type="button"
          className="how-it-works-toggle"
          onClick={() => setShowUseCases((value) => !value)}
          aria-expanded={showUseCases}
        >
          [USE CASES]
          <span className="how-it-works-icon" aria-hidden="true">
            {showUseCases ? "▲" : "▼"}
          </span>
        </button>
      </div>

      {showHowItWorks && (
        <div className="how-it-works">
          <p>
            ENTER AN XRPL ADDRESS AND THE APP CONNECTS DIRECTLY FROM YOUR BROWSER TO PUBLIC
            XRPL NODES — THERE'S NO SERVER, NO DATABASE, AND NOTHING EVER LEAVES YOUR DEVICE.
          </p>
          <p>
            IT FETCHES THE ADDRESS'S TRANSACTION HISTORY ONE PAGE AT A TIME, FILTERS OUT ANY
            TRANSACTION WITHOUT A MEMO, AND DECODES EACH MEMO IT FINDS AS READABLE TEXT, JSON,
            OR RAW DATA.
          </p>
          <p>
            RESULTS STREAM TO THE SCREEN AS EACH PAGE ARRIVES, SO YOU DON'T HAVE TO WAIT FOR
            THE WHOLE HISTORY TO FINISH. SCANNING PAUSES AUTOMATICALLY AFTER ~100 TRANSACTIONS
            AS A SAFETY LIMIT — CLICK "CONTINUE SCANNING" TO KEEP GOING FROM WHERE IT STOPPED.
          </p>
          <p>
            ONCE YOU HAVE RESULTS, YOU CAN NARROW THEM BY DATE RANGE OR FREE-TEXT SEARCH
            WITHOUT RE-SCANNING — FILTERING HAPPENS ENTIRELY IN YOUR BROWSER OVER WHAT'S
            ALREADY BEEN FOUND.
          </p>
        </div>
      )}

      {showUseCases && (
        <div className="how-it-works">
          <p>
            DEPOSIT & PAYMENT RECONCILIATION — EXCHANGES AND MERCHANTS OFTEN PUT INVOICE IDS,
            ORDER REFERENCES, OR USER IDS INTO MEMOS. SCANNING LETS YOU MATCH A DEPOSIT TO A
            CUSTOMER WITHOUT DIGGING THROUGH RAW HEX.
          </p>
          <p>
            WALLET & TRANSACTION FORENSICS — TRACE WHAT A SUSPICIOUS OR SCAM-FLAGGED ADDRESS
            HAS BEEN COMMUNICATING VIA MEMOS, USEFUL FOR SCAM TRACKING OR COMMUNITY DUE
            DILIGENCE.
          </p>
          <p>
            DAPP DEBUGGING — DEVELOPERS CAN VERIFY THEIR OWN PROTOCOL IS WRITING CORRECTLY
            FORMED JSON MEMOS ON-CHAIN BY SCANNING THEIR OWN WALLET'S OUTGOING TRANSACTIONS.
          </p>
          <p>
            PERSONAL RECORD RECOVERY — SOME USERS TREAT THE MEMO FIELD AS A FREE-TEXT NOTE ON
            PAYMENTS AND JUST WANT TO BROWSE THEIR OWN HISTORY'S NOTES WITHOUT A FULL EXPLORER.
          </p>
        </div>
      )}

      <NetworkToggle value={networkId} onChange={handleNetworkChange} disabled={isBusy} />
      <AddressInput onSubmit={handleSubmit} disabled={isBusy} />

      {hasRun && <ConnectionStatus status={state.status} progress={state.progress} />}

      {state.status === "capped" && (
        <button type="button" className="continue-button" onClick={continueScanning}>
          CONTINUE SCANNING
        </button>
      )}

      {state.status === "error" && (
        <p role="alert" className="error-banner">
          {state.error ?? "ALL ENDPOINTS WERE UNREACHABLE. PLEASE TRY AGAIN."}
        </p>
      )}

      {showResults && !isEmptyResult && (
        <>
          <FilterBar key={scanKey} onFilterChange={setFilter} disabled={state.results.length === 0} />
          <ResultsList results={filteredResults} explorerBaseUrl={network.explorerBaseUrl} />
        </>
      )}

      {isEmptyResult && (
        <p className="results-empty">
          {hasNoTransactionHistory
            ? "THIS ADDRESS HAS NO TRANSACTION HISTORY."
            : "NO MEMOS FOUND FOR THIS ADDRESS."}
        </p>
      )}

      {hasRun && (
        <button type="button" className="reset-button" onClick={handleReset}>
          START OVER
        </button>
      )}

      <footer className="app-footer-inline">
        <FooterContact />
      </footer>
    </main>

    <footer className="app-footer">
      <p className="app-footer-donate">
        //APPRECIATE THE TOOLING? CONSIDER{" "}
        <button
          type="button"
          className="app-footer-donate-trigger"
          onClick={() => setShowDonationModal(true)}
          ref={donationTriggerRef}
        >
          A TIP
        </button>
      </p>
    </footer>

    <DonationModal
      open={showDonationModal}
      onClose={() => {
        setShowDonationModal(false);
        donationTriggerRef.current?.focus();
      }}
    />

    <BackToTop />
    </>
  );
}

export default App;
