import type { DecodedMemo } from "../lib/types";

export interface MemoCardProps {
  memo: DecodedMemo;
}

export function MemoCard({ memo }: MemoCardProps) {
  return (
    <div className="memo-card" data-kind={memo.kind}>
      {(memo.type || memo.format) && (
        <div className="memo-card-meta">
          {memo.type && <span className="memo-card-tag">{memo.type}</span>}
          {memo.format && <span className="memo-card-tag">{memo.format}</span>}
        </div>
      )}
      {memo.kind === "json" && (
        <pre className="memo-card-body">{JSON.stringify(memo.json, null, 2)}</pre>
      )}
      {memo.kind === "text" && <p className="memo-card-body">{memo.text}</p>}
      {memo.kind === "raw" && (
        <code className="memo-card-body memo-card-raw">{memo.rawHex || "(EMPTY)"}</code>
      )}
    </div>
  );
}
