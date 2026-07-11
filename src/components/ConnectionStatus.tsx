import type { ScanProgress, ScanStatus } from "../lib/types";

export interface ConnectionStatusProps {
  status: ScanStatus;
  progress: ScanProgress;
}

const STATUS_LABEL: Record<ScanStatus, string> = {
  idle: "IDLE",
  connecting: "CONNECTING…",
  scanning: "SCANNING…",
  capped: "PAUSED (SAFETY LIMIT REACHED)",
  done: "DONE",
  error: "ERROR",
};

export function ConnectionStatus({ status, progress }: ConnectionStatusProps) {
  if (status === "idle") return null;

  return (
    <div className="connection-status" data-status={status}>
      <span className="connection-status-badge">{STATUS_LABEL[status]}</span>
      {progress.activeEndpoint && (
        <span className="connection-status-endpoint">{progress.activeEndpoint}</span>
      )}
      <span className="connection-status-counts">
        {progress.txsScanned.toLocaleString()} TXS SCANNED · {progress.memosFound.toLocaleString()}{" "}
        MEMOS FOUND
      </span>
    </div>
  );
}
