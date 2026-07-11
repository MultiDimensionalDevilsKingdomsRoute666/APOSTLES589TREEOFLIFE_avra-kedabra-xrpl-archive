import { useCallback, useEffect, useRef, useState } from "react";
import type { AccountTxTransaction } from "xrpl";
import { decodeMemo } from "../lib/memoDecoder";
import { XrplClient } from "../lib/xrplClient";
import type { MemoResult, ScanState } from "../lib/types";

const SAFETY_CAP_TXS = 100;
// Ripple epoch (2000-01-01T00:00:00Z) expressed as a Unix offset in seconds.
const RIPPLE_EPOCH_OFFSET_SECONDS = 946_684_800;

const initialState: ScanState = {
  status: "idle",
  progress: { txsScanned: 0, memosFound: 0, activeEndpoint: "" },
  results: [],
};

interface ScanSession {
  client: XrplClient;
  address: string;
  ledgerIndexMax: number;
  marker: unknown;
  txsScanned: number;
  memosFound: number;
}

export function rippleTimeToIso(rippleTime: number | undefined): string {
  if (rippleTime === undefined) return "";
  return new Date((rippleTime + RIPPLE_EPOCH_OFFSET_SECONDS) * 1000).toISOString();
}

export function extractMemoResult(
  tx: AccountTxTransaction,
  address: string,
): MemoResult | undefined {
  const txJson = tx.tx_json;
  if (!txJson?.Memos || txJson.Memos.length === 0) return undefined;

  const account = txJson.Account;
  const destination = (txJson as { Destination?: string }).Destination;
  const isOutgoing = account === address;
  const counterparty = isOutgoing ? destination : account;

  return {
    txHash: tx.hash ?? "",
    date: rippleTimeToIso(txJson.date),
    counterparty,
    counterpartyRole: isOutgoing ? "recipient" : "sender",
    memos: txJson.Memos.map((entry) => decodeMemo(entry.Memo)),
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export interface UseScanOptions {
  createClient?: () => XrplClient;
}

export function useScan(options: UseScanOptions = {}) {
  const createClientOption = options.createClient;
  const createClient = useCallback(
    () => (createClientOption ? createClientOption() : new XrplClient()),
    [createClientOption],
  );
  const [state, setState] = useState<ScanState>(initialState);
  const sessionRef = useRef<ScanSession | null>(null);
  const scanIdRef = useRef(0);

  const runLoop = useCallback(async (scanId: number) => {
    const session = sessionRef.current;
    if (!session) return;

    try {
      for (;;) {
        if (scanIdRef.current !== scanId) return;

        const page = await session.client.getAccountTxPage(
          session.address,
          session.marker,
          session.ledgerIndexMax,
        );
        if (scanIdRef.current !== scanId) return;

        session.marker = page.marker;
        session.txsScanned += page.transactions.length;

        const newResults = page.transactions
          .map((tx) => extractMemoResult(tx, session.address))
          .filter((result): result is MemoResult => result !== undefined);
        session.memosFound += newResults.length;

        setState((prev) => ({
          ...prev,
          progress: {
            txsScanned: session.txsScanned,
            memosFound: session.memosFound,
            activeEndpoint: session.client.activeEndpoint,
          },
          results: newResults.length > 0 ? [...prev.results, ...newResults] : prev.results,
        }));

        const hasMore = session.marker !== undefined;

        if (!hasMore) {
          await session.client.disconnect();
          setState((prev) => ({ ...prev, status: "done" }));
          return;
        }

        if (session.txsScanned >= SAFETY_CAP_TXS) {
          setState((prev) => ({ ...prev, status: "capped" }));
          return;
        }
      }
    } catch (error) {
      if (scanIdRef.current !== scanId) return;
      setState((prev) => ({ ...prev, status: "error", error: errorMessage(error) }));
    }
  }, []);

  const start = useCallback(
    (address: string) => {
      scanIdRef.current += 1;
      const scanId = scanIdRef.current;

      const previousClient = sessionRef.current?.client;
      if (previousClient) void previousClient.disconnect();

      const client = createClient();
      sessionRef.current = {
        client,
        address,
        ledgerIndexMax: 0,
        marker: undefined,
        txsScanned: 0,
        memosFound: 0,
      };

      setState({
        status: "connecting",
        progress: { txsScanned: 0, memosFound: 0, activeEndpoint: "" },
        results: [],
      });

      void (async () => {
        try {
          const ledgerIndexMax = await client.getCurrentLedgerIndex();
          if (scanIdRef.current !== scanId) return;

          const session = sessionRef.current;
          if (!session) return;
          session.ledgerIndexMax = ledgerIndexMax;

          setState((prev) => ({
            ...prev,
            status: "scanning",
            progress: { ...prev.progress, activeEndpoint: client.activeEndpoint },
          }));

          await runLoop(scanId);
        } catch (error) {
          if (scanIdRef.current !== scanId) return;
          setState((prev) => ({ ...prev, status: "error", error: errorMessage(error) }));
        }
      })();
    },
    [createClient, runLoop],
  );

  const continueScanning = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;

    const scanId = scanIdRef.current;
    setState((prev) => ({ ...prev, status: "scanning" }));
    void runLoop(scanId);
  }, [runLoop]);

  const reset = useCallback(() => {
    scanIdRef.current += 1;
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) void session.client.disconnect();
    setState(initialState);
  }, []);

  useEffect(() => {
    return () => {
      scanIdRef.current += 1;
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session) void session.client.disconnect();
    };
  }, []);

  return { state, start, continueScanning, reset };
}
