import { ConnectionError, RippledError } from "xrpl";
import type { Client } from "xrpl";
import { describe, expect, it } from "vitest";
import { XrplClient } from "./xrplClient";

type RequestImpl = (request: unknown) => unknown;

class FakeClient {
  readonly endpoint: string;
  private readonly behavior: {
    failConnect?: boolean;
    requestImpl?: RequestImpl;
  };

  connectCalls = 0;
  requestCalls: unknown[] = [];
  connected = false;

  constructor(
    endpoint: string,
    behavior: {
      failConnect?: boolean;
      requestImpl?: RequestImpl;
    } = {},
  ) {
    this.endpoint = endpoint;
    this.behavior = behavior;
  }

  async connect(): Promise<void> {
    this.connectCalls++;
    if (this.behavior.failConnect) {
      throw new Error(`connect failed for ${this.endpoint}`);
    }
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async request(request: unknown): Promise<unknown> {
    this.requestCalls.push(request);
    if (this.behavior.requestImpl) {
      return this.behavior.requestImpl(request);
    }
    return { result: { transactions: [], marker: undefined } };
  }
}

function fakeAccountTxResponse(marker?: unknown) {
  return { result: { transactions: [{ hash: "ABC" }], marker } };
}

function makeFactory(behaviors: Record<string, ConstructorParameters<typeof FakeClient>[1]>) {
  const created: FakeClient[] = [];
  const factory = (endpoint: string): Client => {
    const fake = new FakeClient(endpoint, behaviors[endpoint]);
    created.push(fake);
    return fake as unknown as Client;
  };
  return { factory, created };
}

const ENDPOINTS = ["wss://a.example", "wss://b.example", "wss://c.example"];

describe("XrplClient", () => {
  it("connects to the first endpoint that succeeds", async () => {
    const { factory } = makeFactory({});
    const client = new XrplClient({ endpoints: ENDPOINTS, createClient: factory, interPageDelayMs: 0 });

    await client.connect();

    expect(client.activeEndpoint).toBe("wss://a.example");
  });

  it("falls back to the next endpoint when the first fails to connect", async () => {
    const { factory } = makeFactory({
      "wss://a.example": { failConnect: true },
    });
    const client = new XrplClient({ endpoints: ENDPOINTS, createClient: factory, interPageDelayMs: 0 });

    await client.connect();

    expect(client.activeEndpoint).toBe("wss://b.example");
  });

  it("throws when every endpoint fails to connect", async () => {
    const { factory } = makeFactory({
      "wss://a.example": { failConnect: true },
      "wss://b.example": { failConnect: true },
      "wss://c.example": { failConnect: true },
    });
    const client = new XrplClient({ endpoints: ENDPOINTS, createClient: factory, interPageDelayMs: 0 });

    await expect(client.connect()).rejects.toThrow();
  });

  it("calls account_tx with the marker and fixed ledger_index_max", async () => {
    let capturedRequest: unknown;
    const { factory } = makeFactory({
      "wss://a.example": {
        requestImpl: (request) => {
          capturedRequest = request;
          return fakeAccountTxResponse("next-marker");
        },
      },
    });
    const client = new XrplClient({ endpoints: ENDPOINTS, createClient: factory, interPageDelayMs: 0 });

    const page = await client.getAccountTxPage("rSomeAddress", "prev-marker", 12345);

    expect(capturedRequest).toMatchObject({
      command: "account_tx",
      account: "rSomeAddress",
      ledger_index_max: 12345,
      marker: "prev-marker",
    });
    expect(page.marker).toBe("next-marker");
    expect(page.transactions).toEqual([{ hash: "ABC" }]);
  });

  it("reconnects to the next endpoint and resumes after a connection error", async () => {
    let aCalls = 0;
    const { factory } = makeFactory({
      "wss://a.example": {
        requestImpl: () => {
          aCalls++;
          throw new ConnectionError("dropped");
        },
      },
      "wss://b.example": {
        requestImpl: () => fakeAccountTxResponse(undefined),
      },
    });
    const client = new XrplClient({ endpoints: ENDPOINTS, createClient: factory, interPageDelayMs: 0 });

    const page = await client.getAccountTxPage("rSomeAddress", undefined, 100);

    expect(aCalls).toBe(1);
    expect(client.activeEndpoint).toBe("wss://b.example");
    expect(page.transactions).toEqual([{ hash: "ABC" }]);
  });

  it("retries with backoff on a rate-limit error and eventually succeeds", async () => {
    let calls = 0;
    const { factory } = makeFactory({
      "wss://a.example": {
        requestImpl: () => {
          calls++;
          if (calls < 3) {
            throw new RippledError("too busy", { error: "tooBusy" });
          }
          return fakeAccountTxResponse(undefined);
        },
      },
    });
    const client = new XrplClient({
      endpoints: ENDPOINTS,
      createClient: factory,
      interPageDelayMs: 0,
      baseBackoffMs: 1,
    });

    const page = await client.getAccountTxPage("rSomeAddress", undefined, 100);

    expect(calls).toBe(3);
    expect(page.transactions).toEqual([{ hash: "ABC" }]);
  });

  it("gives up after exceeding the max rate-limit retries", async () => {
    const { factory } = makeFactory({
      "wss://a.example": {
        requestImpl: () => {
          throw new RippledError("too busy", { error: "tooBusy" });
        },
      },
    });
    const client = new XrplClient({
      endpoints: ENDPOINTS,
      createClient: factory,
      interPageDelayMs: 0,
      baseBackoffMs: 1,
      maxRateLimitRetries: 2,
    });

    await expect(client.getAccountTxPage("rSomeAddress", undefined, 100)).rejects.toThrow(RippledError);
  });

  it("disconnect() tears down the active client", async () => {
    const { factory, created } = makeFactory({});
    const client = new XrplClient({ endpoints: ENDPOINTS, createClient: factory, interPageDelayMs: 0 });

    await client.connect();
    await client.disconnect();

    expect((created[0] as FakeClient).isConnected()).toBe(false);
  });
});
