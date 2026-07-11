import { describe, expect, it } from "vitest";
import { decodeMemo } from "./memoDecoder";

function toHex(input: string): string {
  return Array.from(new TextEncoder().encode(input))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

describe("decodeMemo", () => {
  it("decodes a plain text memo", () => {
    const result = decodeMemo({
      MemoType: toHex("comment"),
      MemoFormat: toHex("text/plain"),
      MemoData: toHex("Hello, XRPL!"),
    });

    expect(result.kind).toBe("text");
    expect(result.text).toBe("Hello, XRPL!");
    expect(result.type).toBe("comment");
    expect(result.format).toBe("text/plain");
    expect(result.json).toBeUndefined();
  });

  it("decodes a JSON memo", () => {
    const payload = { note: "payment for invoice 42" };
    const result = decodeMemo({
      MemoFormat: toHex("application/json"),
      MemoData: toHex(JSON.stringify(payload)),
    });

    expect(result.kind).toBe("json");
    expect(result.json).toEqual(payload);
    expect(result.format).toBe("application/json");
  });

  it("falls back to raw hex for binary/garbage data", () => {
    const rawHex = "00010203fffefd80815566";
    const result = decodeMemo({ MemoData: rawHex });

    expect(result.kind).toBe("raw");
    expect(result.text).toBeUndefined();
    expect(result.json).toBeUndefined();
    expect(result.rawHex).toBe(rawHex);
  });

  it("handles missing fields", () => {
    const result = decodeMemo({});

    expect(result.kind).toBe("raw");
    expect(result.type).toBeUndefined();
    expect(result.format).toBeUndefined();
    expect(result.text).toBeUndefined();
    expect(result.json).toBeUndefined();
    expect(result.rawHex).toBe("");
  });
});
