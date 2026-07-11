import type { NetworkConfig, NetworkId } from "./types";

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  xrpl: {
    id: "xrpl",
    label: "XRPL Mainnet",
    endpoints: ["wss://xrplcluster.com", "wss://s1.ripple.com", "wss://s2.ripple.com"],
    explorerBaseUrl: "https://livenet.xrpl.org/transactions/",
  },
  xahau: {
    id: "xahau",
    label: "Xahau Mainnet",
    endpoints: ["wss://xahau.network", "wss://xahau.org"],
    explorerBaseUrl: "https://xahauexplorer.com/tx/",
  },
};

export const DEFAULT_NETWORK_ID: NetworkId = "xrpl";

const STORAGE_KEY = "xrplMemoScanner:network";

function isNetworkId(value: string): value is NetworkId {
  return value in NETWORKS;
}

export function loadStoredNetworkId(): NetworkId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isNetworkId(stored)) return stored;
  } catch {
    // localStorage unavailable (e.g. private browsing) — fall back to default
  }
  return DEFAULT_NETWORK_ID;
}

export function storeNetworkId(id: NetworkId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore write failures
  }
}
