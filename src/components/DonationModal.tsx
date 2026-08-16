import { useCallback, useEffect, useRef, useState } from "react";

type DonationState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; qrPng: string; deepLink: string; address: string };

type DonationModalProps = {
  open: boolean;
  onClose: () => void;
};

async function requestDonationPayload(): Promise<{ qrPng: string; deepLink: string; address: string }> {
  const response = await fetch("/.netlify/functions/donate", { method: "POST" });
  if (!response.ok) throw new Error("request failed");
  const data = await response.json();
  if (
    typeof data.qrPng !== "string" ||
    typeof data.deepLink !== "string" ||
    typeof data.address !== "string"
  ) {
    throw new Error("malformed response");
  }
  return { qrPng: data.qrPng, deepLink: data.deepLink, address: data.address };
}

export function DonationModal({ open, onClose }: DonationModalProps) {
  const [state, setState] = useState<DonationState>({ status: "loading" });
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(() => {
    setState({ status: "loading" });
    setCopied(false);
    requestDonationPayload()
      .then((result) => setState({ status: "ready", ...result }))
      .catch(() => setState({ status: "error" }));
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const copyAddress = useCallback((address: string) => {
    navigator.clipboard
      .writeText(address)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const container = dialogRef.current;
      if (!container) return;
      const focusable = container.querySelectorAll<HTMLElement>("button, a[href]");
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="donation-modal-backdrop" onClick={onClose}>
      <div
        className="donation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="donation-modal-title"
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="donation-modal-header">
          <h2 id="donation-modal-title">DEV TIPS -THANKS</h2>
          <button
            type="button"
            className="donation-modal-close"
            onClick={onClose}
            aria-label="Close"
            ref={closeButtonRef}
          >
            ×
          </button>
        </div>

        <div className="donation-modal-body">
          {state.status === "loading" && <p>GENERATING PAYMENT REQUEST…</p>}

          {state.status === "error" && (
            <>
              <p role="alert">COULDN'T REACH XAMAN. PLEASE TRY AGAIN.</p>
              <button type="button" className="donation-modal-retry" onClick={load}>
                RETRY
              </button>
            </>
          )}

          {state.status === "ready" && (
            <>
              <p>SCAN WITH XAMAN TO TIP</p>
              <img
                src={state.qrPng}
                alt="Xaman payment request QR code"
                className="donation-modal-qr"
              />
              <a
                href={state.deepLink}
                target="_blank"
                rel="noreferrer"
                className="donation-modal-open-button"
              >
                OPEN IN XAMAN
              </a>
              <code className="donation-modal-address">{state.address}</code>
              <button
                type="button"
                className="donation-modal-copy-button"
                onClick={() => copyAddress(state.address)}
              >
                {copied ? "COPIED!" : "COPY ADDRESS"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
