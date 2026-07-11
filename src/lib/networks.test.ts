import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_NETWORK_ID, NETWORKS, loadStoredNetworkId, storeNetworkId } from "./networks";

const STORAGE_KEY = "xrplMemoScanner:network";

function fakeLocalStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", fakeLocalStorage());
});

describe("NETWORKS", () => {
  it("defines endpoints and an explorer URL for xrpl and xahau", () => {
    expect(NETWORKS.xrpl.endpoints.length).toBeGreaterThan(0);
    expect(NETWORKS.xahau.endpoints.length).toBeGreaterThan(0);
    expect(NETWORKS.xrpl.explorerBaseUrl).toMatch(/^https:\/\//);
    expect(NETWORKS.xahau.explorerBaseUrl).toMatch(/^https:\/\//);
  });
});

describe("loadStoredNetworkId", () => {
  it("returns the default when nothing is stored", () => {
    expect(loadStoredNetworkId()).toBe(DEFAULT_NETWORK_ID);
  });

  it("returns the stored network id when valid", () => {
    localStorage.setItem(STORAGE_KEY, "xahau");
    expect(loadStoredNetworkId()).toBe("xahau");
  });

  it("falls back to the default when the stored value is not a known network", () => {
    localStorage.setItem(STORAGE_KEY, "not-a-network");
    expect(loadStoredNetworkId()).toBe(DEFAULT_NETWORK_ID);
  });
});

describe("storeNetworkId", () => {
  it("persists the network id for a later load", () => {
    storeNetworkId("xahau");
    expect(loadStoredNetworkId()).toBe("xahau");
  });
});
