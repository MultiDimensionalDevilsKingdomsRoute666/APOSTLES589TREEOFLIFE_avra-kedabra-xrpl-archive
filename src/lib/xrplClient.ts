import { Client, ConnectionError, RippledError } from "xrpl";
import type { AccountTxTransaction } from "xrpl";

export const DEFAULT_ENDPOINTS = [
  "wss://xrplcluster.com",
  "wss://s1.ripple.com",
  "wss://s2.ripple.com",
];

const RATE_LIMIT_ERROR_CODES = new Set(["tooBusy", "slowDown"]);
const DEFAULT_MAX_RATE_LIMIT_RETRIES = 5;
const DEFAULT_BASE_BACKOFF_MS = 500;
const DEFAULT_INTER_PAGE_DELAY_MS = 150;
const ACCOUNT_TX_PAGE_LIMIT = 200;

export interface AccountTxPage {
  transactions: AccountTxTransaction[];
  marker?: unknown;
}

export interface XrplClientOptions {
  endpoints?: string[];
  createClient?: (endpoint: string) => Client;
  interPageDelayMs?: number;
  baseBackoffMs?: number;
  maxRateLimitRetries?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof RippledError)) return false;
  const data = error.data as { error?: string } | undefined;
  return data?.error !== undefined && RATE_LIMIT_ERROR_CODES.has(data.error);
}

export class XrplClient {
  private readonly endpoints: string[];
  private readonly createClient: (endpoint: string) => Client;
  private readonly interPageDelayMs: number;
  private readonly baseBackoffMs: number;
  private readonly maxRateLimitRetries: number;

  private client: Client | undefined;
  private endpointIndex = 0;

  constructor(options: XrplClientOptions = {}) {
    this.endpoints = options.endpoints ?? DEFAULT_ENDPOINTS;
    if (this.endpoints.length === 0) {
      throw new Error("XrplClient requires at least one endpoint");
    }
    this.createClient = options.createClient ?? ((endpoint) => new Client(endpoint));
    this.interPageDelayMs = options.interPageDelayMs ?? DEFAULT_INTER_PAGE_DELAY_MS;
    this.baseBackoffMs = options.baseBackoffMs ?? DEFAULT_BASE_BACKOFF_MS;
    this.maxRateLimitRetries = options.maxRateLimitRetries ?? DEFAULT_MAX_RATE_LIMIT_RETRIES;
  }

  get activeEndpoint(): string {
    return this.endpoints[this.endpointIndex];
  }

  async connect(): Promise<void> {
    await this.connectStartingFrom(0);
  }

  async disconnect(): Promise<void> {
    const client = this.client;
    this.client = undefined;
    if (client?.isConnected()) {
      await client.disconnect();
    }
  }

  async getAccountTxPage(
    address: string,
    marker: unknown,
    ledgerIndexMax: number,
  ): Promise<AccountTxPage> {
    let rateLimitAttempt = 0;

    for (;;) {
      if (!this.client) {
        await this.connect();
      }

      try {
        const response = await this.client!.request({
          command: "account_tx",
          account: address,
          ledger_index_min: -1,
          ledger_index_max: ledgerIndexMax,
          limit: ACCOUNT_TX_PAGE_LIMIT,
          marker: marker as never,
        });

        if (this.interPageDelayMs > 0) {
          await sleep(this.interPageDelayMs);
        }

        return {
          transactions: response.result.transactions,
          marker: response.result.marker,
        };
      } catch (error) {
        if (isRateLimitError(error) && rateLimitAttempt < this.maxRateLimitRetries) {
          rateLimitAttempt++;
          await sleep(this.baseBackoffMs * 2 ** (rateLimitAttempt - 1));
          continue;
        }

        if (error instanceof ConnectionError) {
          await this.connectStartingFrom(this.endpointIndex + 1);
          continue;
        }

        throw error;
      }
    }
  }

  async getCurrentLedgerIndex(): Promise<number> {
    for (;;) {
      if (!this.client) {
        await this.connect();
      }

      try {
        return await this.client!.getLedgerIndex();
      } catch (error) {
        if (error instanceof ConnectionError) {
          await this.connectStartingFrom(this.endpointIndex + 1);
          continue;
        }
        throw error;
      }
    }
  }

  private async connectStartingFrom(startIndex: number): Promise<void> {
    await this.disconnect();

    for (let offset = 0; offset < this.endpoints.length; offset++) {
      const index = (startIndex + offset) % this.endpoints.length;
      this.endpointIndex = index;
      try {
        const client = this.createClient(this.endpoints[index]);
        await client.connect();
        this.client = client;
        return;
      } catch {
        // try the next endpoint in the fallback list
      }
    }

    throw new Error("Unable to connect to any XRPL endpoint");
  }
}
