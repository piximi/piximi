import type { Page, PageRequest } from "../types";

export type WindowFetch<R> = (
  page: PageRequest,
  signal: AbortSignal,
) => Promise<Page<R>>;

export type WindowSnapshot<R> = {
  /* Matches of the query; 0 until the first page answers. */
  total: number;
  /* The total describes the current query at the current data revision. */
  ready: boolean;
  get: (index: number) => R | undefined;
  /* The loaded records of the requested range, in order. */
  loaded: R[];
};

type Options = {
  /* Records fetched per request; ranges are served in these units. */
  chunkSize?: number;
  /* Chunks kept around the range before the farthest are dropped. */
  maxChunks?: number;
  /* Chunks fetched on either side of the range, ahead of scrolling. */
  overscan?: number;
};

const EMPTY: never[] = [];

/*
 * A sparse window over a paged backend listing, for a virtualized grid: the
 * grid says which item indices it shows, and this fetches the chunks that
 * cover them (plus some ahead), keeps a bounded number of them, and exposes
 * records by index. A new query drops everything; a new data revision keeps
 * the rows in view while it fetches them again, so a grid never blanks
 * while an event is being applied.
 */
export class QueryWindowController<R> {
  readonly #chunkSize: number;
  readonly #maxChunks: number;
  readonly #overscan: number;

  #key: string | undefined;
  #fetch: WindowFetch<R> | undefined;
  #revision: number | undefined;
  /* Moves whenever answers in flight stop being wanted. */
  #generation = 0;
  #total: number | null = null;
  #ready = false;
  #range = { start: 0, end: 0 };
  #chunks = new Map<number, R[]>();
  #inFlight = new Map<number, AbortController>();
  #listeners = new Set<() => void>();
  #active = true;
  #snapshot: WindowSnapshot<R>;

  constructor({ chunkSize = 100, maxChunks = 40, overscan = 1 }: Options = {}) {
    this.#chunkSize = chunkSize;
    this.#maxChunks = maxChunks;
    this.#overscan = overscan;
    this.#snapshot = this.#buildSnapshot();
  }

  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  getSnapshot(): WindowSnapshot<R> {
    return this.#snapshot;
  }

  /* A different query: nothing of the old one applies. */
  setSource(key: string, fetch: WindowFetch<R>): void {
    this.#resume();
    if (key === this.#key && fetch === this.#fetch) return;
    this.#key = key;
    this.#fetch = fetch;
    this.#generation++;
    this.#abortAll();
    this.#chunks.clear();
    this.#total = null;
    this.#ready = false;
    this.#sync();
    this.#notify();
  }

  /* The same query over changed data: refetch what is in view. */
  setRevision(revision: number): void {
    this.#resume();
    const first = this.#revision === undefined;
    if (this.#revision === revision) return;
    this.#revision = revision;
    if (first) return;
    this.#generation++;
    this.#abortAll();
    this.#ready = false;
    // Rows outside the range are stale and cheap to fetch again later.
    for (const index of [...this.#chunks.keys()]) {
      if (!this.#needed().has(index)) this.#chunks.delete(index);
    }
    this.#sync(true);
    this.#notify();
  }

  /* Item indices `[start, end)` the grid currently shows. */
  setRange(start: number, end: number): void {
    this.#resume();
    if (start === this.#range.start && end === this.#range.end) return;
    this.#range = { start: Math.max(0, start), end: Math.max(0, end) };
    this.#sync();
    this.#notify();
  }

  /* Stops the fetching; any later call picks it up again (React's
   * development mode unmounts and remounts effects once). */
  dispose(): void {
    this.#active = false;
    this.#abortAll();
  }

  #resume(): void {
    if (this.#active) return;
    this.#active = true;
    this.#sync();
  }

  #needed(): Set<number> {
    const chunk = this.#chunkSize;
    const first = Math.max(
      0,
      Math.floor(this.#range.start / chunk) - this.#overscan,
    );
    let last = Math.ceil(this.#range.end / chunk) - 1 + this.#overscan;
    if (this.#total !== null) {
      last = Math.min(last, Math.ceil(this.#total / chunk) - 1);
    }
    const needed = new Set<number>();
    // The first chunk is always wanted: it carries the total.
    needed.add(0);
    for (let index = first; index <= last; index++) needed.add(index);
    return needed;
  }

  #sync(refetch = false): void {
    if (!this.#fetch) return;
    const needed = this.#needed();
    for (const [index, controller] of this.#inFlight) {
      if (!needed.has(index)) {
        controller.abort();
        this.#inFlight.delete(index);
      }
    }
    for (const index of needed) {
      if (this.#inFlight.has(index)) continue;
      if (this.#chunks.has(index) && !refetch) continue;
      this.#load(index);
    }
    this.#evict(needed);
  }

  #load(index: number): void {
    const fetch = this.#fetch!;
    const generation = this.#generation;
    const controller = new AbortController();
    this.#inFlight.set(index, controller);
    const offset = index * this.#chunkSize;
    fetch({ offset, limit: this.#chunkSize }, controller.signal).then(
      (page) => {
        if (controller.signal.aborted || generation !== this.#generation)
          return;
        this.#inFlight.delete(index);
        this.#chunks.set(index, page.items);
        if (page.total !== this.#total) {
          this.#total = page.total;
          const last = Math.ceil(page.total / this.#chunkSize) - 1;
          for (const loaded of [...this.#chunks.keys()]) {
            if (loaded > last) this.#chunks.delete(loaded);
          }
        }
        this.#ready = this.#inFlight.size === 0;
        // A total that moved may uncover chunks the range now needs.
        this.#sync();
        this.#notify();
      },
      (error: unknown) => {
        if (controller.signal.aborted || generation !== this.#generation)
          return;
        this.#inFlight.delete(index);
        console.error(error);
        this.#ready = this.#inFlight.size === 0;
        this.#notify();
      },
    );
  }

  #evict(needed: Set<number>): void {
    if (this.#chunks.size <= this.#maxChunks) return;
    const center = (this.#range.start + this.#range.end) / 2 / this.#chunkSize;
    const spare = [...this.#chunks.keys()]
      .filter((index) => !needed.has(index))
      .sort((a, b) => Math.abs(b - center) - Math.abs(a - center));
    for (const index of spare) {
      if (this.#chunks.size <= this.#maxChunks) break;
      this.#chunks.delete(index);
    }
  }

  #abortAll(): void {
    for (const controller of this.#inFlight.values()) controller.abort();
    this.#inFlight.clear();
  }

  #buildSnapshot(): WindowSnapshot<R> {
    const chunks = this.#chunks;
    const size = this.#chunkSize;
    const total = this.#total ?? 0;
    const get = (index: number): R | undefined =>
      chunks.get(Math.floor(index / size))?.[index % size];
    const loaded: R[] = [];
    const end = Math.min(this.#range.end, total);
    for (let index = this.#range.start; index < end; index++) {
      const record = get(index);
      if (record !== undefined) loaded.push(record);
    }
    return {
      total,
      ready: this.#ready && this.#total !== null,
      get,
      loaded: loaded.length === 0 ? EMPTY : loaded,
    };
  }

  #notify(): void {
    this.#snapshot = this.#buildSnapshot();
    for (const listener of this.#listeners) listener();
  }
}
