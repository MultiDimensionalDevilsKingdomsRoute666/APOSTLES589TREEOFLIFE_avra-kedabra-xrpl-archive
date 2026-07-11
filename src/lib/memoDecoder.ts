import type { DecodedMemo, MemoKind } from "./types";

export interface RawMemoFields {
  MemoType?: string;
  MemoFormat?: string;
  MemoData?: string;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
}

function tryDecodeUtf8(hex: string | undefined): string | undefined {
  if (!hex) return undefined;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(hexToBytes(hex));
  } catch {
    return undefined;
  }
}

// Rejects binary noise that happens to be valid UTF-8 by requiring
// the decoded text to be mostly free of control characters.
function isPrintableText(text: string): boolean {
  if (text.length === 0) return false;
  let controlCount = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    const isAllowedWhitespace = code === 9 || code === 10 || code === 13;
    if (code < 32 && !isAllowedWhitespace) controlCount++;
  }
  return controlCount / text.length < 0.05;
}

function tryParseJsonObject(text: string): unknown | undefined {
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed !== null && typeof parsed === "object" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function decodeMemo(memo: RawMemoFields): DecodedMemo {
  const decodedType = tryDecodeUtf8(memo.MemoType);
  const decodedFormat = tryDecodeUtf8(memo.MemoFormat);
  const rawHex = memo.MemoData ?? "";
  const decodedData = tryDecodeUtf8(memo.MemoData);

  let kind: MemoKind = "raw";
  let text: string | undefined;
  let json: unknown;

  if (decodedData !== undefined) {
    const parsed = tryParseJsonObject(decodedData);
    if (parsed !== undefined) {
      kind = "json";
      json = parsed;
      text = decodedData;
    } else if (isPrintableText(decodedData)) {
      kind = "text";
      text = decodedData;
    }
  }

  return {
    type: decodedType && isPrintableText(decodedType) ? decodedType : undefined,
    format: decodedFormat && isPrintableText(decodedFormat) ? decodedFormat : undefined,
    kind,
    text,
    json,
    rawHex,
  };
}
