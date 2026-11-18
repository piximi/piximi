import { describe, expect, it, vi } from "vitest";

import { QueryWindowController } from "./windowController";

import type { Page, PageRequest } from "../types";

type Deferred = {
  page: PageRequest;
  signal: AbortSignal;
  resolve: (page: Page<string>) => void;
};

/* A fetch over `rows` that answers only when told to. */
const listing = (rows: () => string[]) => {
  const pending: Deferred[] = [];
  const fetch = (page: PageRequest, signal: AbortSignal) =>
    new Promise<Page<string>>((resolve) => {
      pending.push({ page, signal, resolve });
    });
  const answer = (count = pending.length) => {
    for (const { page, resolve } of pending.splice(0, count)) {
      const all = rows();
      const offset = page.offset ?? 0;
      resolve({
        items: all.slice(offset, offset + page.limit),
        total: all.length,
      });
    }
  };
  return { fetch, pending, answer };
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const ids = (count: number) => Array.from({ length: count }, (_, i) => `r${i}`);

describe("QueryWindowController", () => {
  it("learns the total from the first chunk and serves records by index", async () => {
    const source = listing(() => ids(250));
    const window = new QueryWindowController<string>({ chunkSize: 100 });
    window.setSource("q", source.fetch);
    expect(window.getSnapshot()).toMatchObject({ total: 0, ready: false });
    expect(source.pending.map((p) => p.page.offset)).toEqual([0]);

    source.answer();
    await flush();
    const snapshot = window.getSnapshot();
    expect(snapshot).toMatchObject({ total: 250, ready: true });
    expect(snapshot.get(0)).toBe("r0");
    expect(snapshot.get(99)).toBe("r99");
    expect(snapshot.get(100)).toBeUndefined();
  });

  it("fetches the chunks a range needs, one ahead on each side", async () => {
    const source = listing(() => ids(1000));
    const window = new QueryWindowController<string>({ chunkSize: 100 });
    window.setSource("q", source.fetch);
    source.answer();
    await flush();

    window.setRange(520, 560);
    expect(source.pending.map((p) => p.page.offset).sort()).toEqual([
      400, 500, 600,
    ]);
    source.answer();
    await flush();
    const snapshot = window.getSnapshot();
    expect(snapshot.get(520)).toBe("r520");
    expect(snapshot.loaded).toEqual(ids(1000).slice(520, 560));
  });

  it("notifies subscribers as chunks arrive", async () => {
    const source = listing(() => ids(10));
    const window = new QueryWindowController<string>({ chunkSize: 5 });
    const listener = vi.fn();
    window.subscribe(listener);
    window.setSource("q", source.fetch);
    source.answer();
    await flush();
    expect(listener).toHaveBeenCalled();
    expect(window.getSnapshot().ready).toBe(true);
  });

  it("drops everything for a new query and ignores late answers to the old one", async () => {
    const source = listing(() => ids(50));
    const window = new QueryWindowController<string>({ chunkSize: 10 });
    window.setSource("a", source.fetch);
    const stale = source.pending[0];
    window.setSource("b", source.fetch);
    expect(stale.signal.aborted).toBe(true);

    stale.resolve({ items: ["old"], total: 1 });
    await flush();
    expect(window.getSnapshot().get(0)).toBeUndefined();
    source.answer();
    await flush();
    expect(window.getSnapshot().get(0)).toBe("r0");
  });

  it("keeps rows in view while a new revision loads, then replaces them", async () => {
    let rows = ids(30);
    const source = listing(() => rows);
    const window = new QueryWindowController<string>({ chunkSize: 10 });
    window.setSource("q", source.fetch);
    window.setRevision(1);
    window.setRange(0, 10);
    source.answer();
    await flush();
    expect(window.getSnapshot().get(0)).toBe("r0");

    rows = ["new", ...ids(29)];
    window.setRevision(2);
    expect(window.getSnapshot()).toMatchObject({ ready: false });
    expect(window.getSnapshot().get(0)).toBe("r0");
    source.answer();
    await flush();
    expect(window.getSnapshot()).toMatchObject({ total: 30, ready: true });
    expect(window.getSnapshot().get(0)).toBe("new");
  });

  it("keeps a bounded number of chunks around the range", async () => {
    const source = listing(() => ids(10000));
    const window = new QueryWindowController<string>({
      chunkSize: 100,
      maxChunks: 4,
      overscan: 0,
    });
    window.setSource("q", source.fetch);
    for (const start of [0, 1000, 2000, 3000, 4000, 5000]) {
      window.setRange(start, start + 50);
      source.answer();
      await flush();
    }
    const snapshot = window.getSnapshot();
    expect(snapshot.get(5000)).toBe("r5000");
    expect(snapshot.get(1000)).toBeUndefined();
  });

  it("picks up again after a dispose, as React remounts effects in development", async () => {
    const source = listing(() => ids(5));
    const window = new QueryWindowController<string>({ chunkSize: 10 });
    window.setSource("q", source.fetch);
    const first = source.pending[0];
    window.dispose();
    expect(first.signal.aborted).toBe(true);
    window.setSource("q", source.fetch);
    window.setRevision(1);
    expect(source.pending.length).toBe(2);
    source.answer();
    await flush();
    expect(window.getSnapshot()).toMatchObject({ total: 5, ready: true });
  });

  it("shrinks when the total shrinks", async () => {
    let rows = ids(30);
    const source = listing(() => rows);
    const window = new QueryWindowController<string>({ chunkSize: 10 });
    window.setSource("q", source.fetch);
    window.setRevision(1);
    window.setRange(20, 30);
    source.answer();
    await flush();
    expect(window.getSnapshot().get(25)).toBe("r25");

    rows = ids(5);
    window.setRevision(2);
    source.answer();
    await flush();
    expect(window.getSnapshot().total).toBe(5);
    expect(window.getSnapshot().get(25)).toBeUndefined();
  });
});
