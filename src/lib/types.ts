export type ScanStatus = "idle" | "connecting" | "scanning" | "capped" | "done" | "error";

export interface ScanProgress {
  txsScanned: number;
  memosFound: number;
  activeEndpoint: string;
}

export type MemoKind = "json" | "text" | "raw";

export interface DecodedMemo {
  type?: string;
  format?: string;
  kind: MemoKind;
  text?: string;
  json?: unknown;
  rawHex: string;
}

export interface MemoResult {
  txHash: string;
  date: string;
  counterparty?: string;
  counterpartyRole?: "sender" | "recipient";
  memos: DecodedMemo[];
}

export interface ScanState {
  status: ScanStatus;
  progress: ScanProgress;
  results: MemoResult[];
  error?: string;
}

export interface ResultFilter {
  dateFrom?: string;
  dateTo?: string;
  searchText?: string;
}
