import { describe, expect, it } from "vitest";
import type { AccountTxTransaction } from "xrpl";
import { extractMemoResult, rippleTimeToIso } from "./useScan";

function toHex(input: string): string {
  return Array.from(new TextEncoder().encode(input))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function makeTx(overrides: Record<string, unknown>): AccountTxTransaction {
  return {
    hash: "TXHASH",
    ledger_index: 1,
    validated: true,
    meta: "",
    tx_json: {
      TransactionType: "Payment",
      Account: "rSender",
      Fee: "10",
      Sequence: 1,
      SigningPubKey: "",
      ...overrides,
    },
  } as unknown as AccountTxTransaction;
}

describe("rippleTimeToIso", () => {
  it("converts a ripple epoch timestamp to an ISO string", () => {
    expect(rippleTimeToIso(0)).toBe("2000-01-01T00:00:00.000Z");
  });

  it("returns an empty string when the timestamp is missing", () => {
    expect(rippleTimeToIso(undefined)).toBe("");
  });
});

describe("extractMemoResult", () => {
  it("returns undefined when the transaction has no memos", () => {
    const tx = makeTx({});
    expect(extractMemoResult(tx, "rSender")).toBeUndefined();
  });

  it("decodes memos and uses Destination as counterparty when scanned address is the sender", () => {
    const tx = makeTx({
      Destination: "rReceiver",
      date: 0,
      Memos: [{ Memo: { MemoData: toHex("hello") } }],
    });

    const result = extractMemoResult(tx, "rSender");

    expect(result).toEqual({
      txHash: "TXHASH",
      date: "2000-01-01T00:00:00.000Z",
      counterparty: "rReceiver",
      counterpartyRole: "recipient",
      memos: [
        {
          type: undefined,
          format: undefined,
          kind: "text",
          text: "hello",
          json: undefined,
          rawHex: toHex("hello"),
        },
      ],
    });
  });

  it("uses Account as counterparty when the scanned address is the destination", () => {
    const tx = makeTx({
      Account: "rSender",
      Destination: "rScanned",
      Memos: [{ Memo: { MemoData: toHex("hi") } }],
    });

    const result = extractMemoResult(tx, "rScanned");

    expect(result?.counterparty).toBe("rSender");
    expect(result?.counterpartyRole).toBe("sender");
  });
});
