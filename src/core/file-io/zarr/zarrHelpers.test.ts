import { describe, expect, it } from "vitest";

import {
  createGroup,
  createRootGroup,
  writeArray,
} from "../project-saver/zarr/writers";
import { PiximiStore } from "./stores";
import { escapeSegment, unescapePath } from "./paths";
import {
  getAttr,
  getDataset,
  getGroup,
  hasNode,
  openRootGroup,
  readWholeArray,
} from "./utils";

/**
 * Unit coverage for the zarr read/write helpers, independent of the project
 * format. The format round-trip tests exercise these too, but only along the
 * paths `writeV2` happens to take — the guards and edge cases below are the
 * ones a format change would quietly walk past.
 */

const newStore = (name = "helpers") => new PiximiStore(name);

describe("group and attribute round trip", () => {
  it("preserves attribute values through a create/open cycle", async () => {
    const store = newStore();
    const root = await createRootGroup(store, { version: "2.0.0" });
    await createGroup(root, "data", {
      ids: ["a", "b"],
      // Falsy scalars must survive: a truthiness-gated reader rejects these.
      shuffle_B: 0,
      count: 0,
      label: "",
      nested: [[1, "one"]],
    });

    const data = await getGroup(await openRootGroup(store), "data");
    expect(await getAttr(data, "ids")).toEqual(["a", "b"]);
    expect(await getAttr(data, "shuffle_B")).toBe(0);
    expect(await getAttr(data, "count")).toBe(0);
    expect(await getAttr(data, "label")).toBe("");
    expect(await getAttr(data, "nested")).toEqual([[1, "one"]]);
  });

  it("normalises non-finite numbers to null rather than to strings", async () => {
    const store = newStore();
    const root = await createRootGroup(store, {});
    await createGroup(root, "stats", {
      mean: NaN,
      high: Infinity,
      low: -Infinity,
      real: 1.5,
      list: [NaN, 2.5],
    });

    const stats = await getGroup(await openRootGroup(store), "stats");
    expect(await getAttr(stats, "mean")).toBeNull();
    expect(await getAttr(stats, "high")).toBeNull();
    expect(await getAttr(stats, "low")).toBeNull();
    expect(await getAttr(stats, "real")).toBe(1.5);
    expect(await getAttr(stats, "list")).toEqual([null, 2.5]);
  });

  it("throws on a missing attribute rather than yielding undefined", async () => {
    const store = newStore();
    await createRootGroup(store, { version: "2.0.0" });
    const root = await openRootGroup(store);

    await expect(getAttr(root, "absent")).rejects.toThrow(
      /Expected attribute "absent"/,
    );
  });
});

describe("path segments", () => {
  /**
   * zarrita resolves child paths through `new URL` + `decodeURIComponent`. `%`
   * makes that throw and `#`/`?` truncate the path, so these three are
   * substituted on the way in and restored in the store. Model names and, in
   * legacy archives, image filenames are user data, so all three are reachable.
   */
  it.each(["plain", "my image.png", "100% acc", "model#1", "a?b", "résumé"])(
    "round-trips a group named %j and keeps the on-disk name verbatim",
    async (name) => {
      const store = newStore("segments");
      const root = await createRootGroup(store, {});
      await createGroup(root, name, { name });

      const group = await getGroup(await openRootGroup(store), name);
      expect(await getAttr(group, "name")).toBe(name);

      // The zip entry must carry the original characters, so that an archive
      // written here stays byte-compatible with the zarr.js-era layout.
      expect(Object.keys(store.zip.files)).toContain(
        `segments.zarr/${name}/zarr.json`,
      );
    },
  );

  it("leaves names without the three problem characters untouched", () => {
    expect(escapeSegment("my image.png")).toBe("my image.png");
    expect(unescapePath("/a/b")).toBe("/a/b");
  });

  it("is an exact inverse pair", () => {
    for (const name of ["100%", "a#b", "a?b", "%#?", "mixed #1 (50%)"]) {
      expect(unescapePath(escapeSegment(name))).toBe(name);
      // And the escaped form must not contain the raw characters.
      expect(escapeSegment(name)).not.toMatch(/[%#?]/);
    }
  });
});

describe("writeArray", () => {
  it("round-trips 1-D and 2-D arrays, preserving orientation", async () => {
    const store = newStore();
    const root = await createRootGroup(store, {});
    await writeArray(root, "flat", new Uint32Array([7, 8, 9]));
    // Non-square and asymmetric, so a transpose cannot pass unnoticed.
    await writeArray(
      root,
      "matrix",
      new Float64Array([1, 2, 3, 10, 20, 30]),
      [2, 3],
    );

    const opened = await openRootGroup(store);

    const flat = await readWholeArray(opened, "flat");
    expect(flat.shape).toEqual([3]);
    expect(Array.from(flat.data as Uint32Array)).toEqual([7, 8, 9]);

    const matrix = await readWholeArray(opened, "matrix");
    expect(matrix.shape).toEqual([2, 3]);
    expect(Array.from(matrix.data as Float64Array)).toEqual([
      1, 2, 3, 10, 20, 30,
    ]);
  });

  it("returns a buffer sized exactly to the array", async () => {
    const store = newStore();
    const root = await createRootGroup(store, {});
    await writeArray(root, "pixels", new Uint16Array([1, 2, 3, 4]), [2, 2]);

    const { data } = await readWholeArray(await openRootGroup(store), "pixels");
    // These buffers become IndexedDB records, so an oversized one inflates
    // stored size and hands the renderer too many pixels.
    expect(data.byteOffset).toBe(0);
    expect(data.buffer.byteLength).toBe(8);
  });

  it("rejects a shape that disagrees with the buffer length", async () => {
    const store = newStore();
    const root = await createRootGroup(store, {});
    await expect(
      writeArray(root, "bad", new Uint8Array(5), [2, 3]),
    ).rejects.toThrow(/does not match shape/);
  });

  it("rejects a zero extent, which would write no chunk at all", async () => {
    const store = newStore();
    const root = await createRootGroup(store, {});
    await expect(
      writeArray(root, "empty", new Uint8Array(0), [0]),
    ).rejects.toThrow(/degenerate shape/);
  });

  it("rejects a typed array with no v3 data type", async () => {
    const store = newStore();
    const root = await createRootGroup(store, {});
    await expect(
      writeArray(root, "big", new BigInt64Array(2) as never),
    ).rejects.toThrow(/unmapped typed array/);
  });
});

describe("node probing", () => {
  it("distinguishes present from absent nodes", async () => {
    const store = newStore();
    const root = await createRootGroup(store, {});
    await createGroup(root, "present", {});
    await writeArray(root, "array", new Uint8Array([1]));

    const opened = await openRootGroup(store);
    expect(await hasNode(opened, "present")).toBe(true);
    expect(await hasNode(opened, "array")).toBe(true);
    expect(await hasNode(opened, "absent")).toBe(false);
  });

  it("reports a helpful error for a missing or wrongly-typed node", async () => {
    const store = newStore();
    const root = await createRootGroup(store, {});
    await createGroup(root, "agroup", {});

    const opened = await openRootGroup(store);
    await expect(getDataset(opened, "absent")).rejects.toThrow(
      /Expected dataset "absent"/,
    );
    // A group where an array was expected, and vice versa.
    await expect(getDataset(opened, "agroup")).rejects.toThrow(
      /Expected dataset "agroup"/,
    );
    await expect(getGroup(opened, "absent")).rejects.toThrow(
      /Expected key "absent" of type "Group"/,
    );
  });
});
