import type { MemoResult } from "../lib/types";
import { MemoCard } from "./MemoCard";

export interface NumberedMemoResult extends MemoResult {
  refNumber: number;
}

export interface ResultsListProps {
  results: NumberedMemoResult[];
  explorerBaseUrl: string;
}

export function ResultsList({ results, explorerBaseUrl }: ResultsListProps) {
  if (results.length === 0) {
    return <p className="results-empty">NO MEMOS MATCH THE CURRENT FILTERS.</p>;
  }

  return (
    <ul className="results-list">
      {results.map((result) => (
        <li key={result.txHash} className="results-item">
          <div className="results-item-header">
            <span className="results-item-ref" title="REFERENCE NUMBER FOR THIS SITE">
              #{result.refNumber}
            </span>
            <a
              href={`${explorerBaseUrl}${result.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="results-item-hash"
            >
              {result.txHash}
            </a>
            <time dateTime={result.date}>{formatDate(result.date)}</time>
          </div>
          {result.counterparty && (
            <div className="results-item-counterparty">
              <span className="results-item-counterparty-label">
                {result.counterpartyRole === "recipient" ? "RECIPIENT" : "SENDER"}
              </span>
              {result.counterparty}
            </div>
          )}
          <div className="results-item-memos">
            {result.memos.map((memo, index) => (
              <MemoCard key={index} memo={memo} />
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}
