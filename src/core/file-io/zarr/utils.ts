import * as zarr from "zarrita";

import { emptyArrayOf } from "./dtypes";
import { escapeSegment } from "./paths";

import type {
  Array as ZarrArray,
  DataType,
  Group as ZarrGroup,
  Location,
  NumberDataType,
  Slice,
  TypedArray,
} from "zarrita";

import type { ReadStore } from "./stores";

/**
 * Exported under the bare names the readers already use, so naming zarrita's
 * store generic doesn't leak into the ~60 function signatures across
 * readV2/readV01/readV02/readV11/common.
 */
export type Group = ZarrGroup<ReadStore>;

/** Internal: callers receive these from `getDataset` and never name the type. */
type Dataset = ZarrArray<DataType, ReadStore>;

/**
 * Stands in for zarr.js's `RawArray`: zarrita's `Chunk` with the dtype narrowed
 * to the numeric types. `.data` and `.shape` carry over unchanged, and the
 * readers cast `.data` to a concrete typed array at each call site.
 *
 * The narrowing is an assertion rather than a proof — the same one zarr.js's
 * `as RawArray` casts made. Every dataset Piximi writes is numeric; a
 * hand-edited archive with a string dtype would mis-type here rather than
 * throw. `readWholeArray`'s callers all check `shape`, which is where a real
 * mismatch shows up.
 */
type RawArray = {
  data: TypedArray<NumberDataType>;
  shape: number[];
  stride: number[];
};

/**
 * Resolve a child node. Always use this rather than `Location#resolve` for a
 * dynamic name — see `./paths` for the characters that need escaping first.
 */
export const child = <S>(parent: Location<S>, name: string): Location<S> =>
  parent.resolve(escapeSegment(name));

/**
 * The `<name>.zarr` prefix lives in the store, so the zarr root is just `/`.
 *
 * Deliberately the unpinned `zarr.open`, never `open.v3`: Piximi's format
 * version 2.x spans two wire formats — archives written by the zarr.js-era
 * build are Zarr v2 on disk, newer ones are v3 — and `detectVersion` routes on
 * the app version, so one reader has to serve both. Auto-detection is what
 * makes that work.
 */
export const openRootGroup = (store: ReadStore): Promise<Group> =>
  zarr.open(store, { kind: "group" });

export const getGroup = async (root: Group, key: string): Promise<Group> => {
  try {
    return await zarr.open(child(root, key), { kind: "group" });
  } catch (cause) {
    throw new Error(
      `Expected key "${key}" of type "Group" in group "${root.path}"`,
      { cause },
    );
  }
};

export const getDataset = async (
  root: Group,
  key: string,
): Promise<Dataset> => {
  try {
    return await zarr.open(child(root, key), { kind: "array" });
  } catch (cause) {
    throw new Error(`Expected dataset "${key}" in group "${root.path}"`, {
      cause,
    });
  }
};

/** Metadata keys that mark a node's existence, across both zarr formats. */
const NODE_MARKERS = ["zarr.json", ".zarray", ".zgroup"] as const;

/**
 * Replaces zarr.js's `Group#containsItem`, which was a pure key-existence
 * probe and so could never mask a decode failure.
 *
 * Deliberately *not* try/`zarr.open`/catch-`NotFoundError`: zarrita's auto
 * `open` does `rethrowUnless(err, NotFoundError, InvalidMetadataError)` and
 * then falls back to the other format, so corrupt metadata — truncated JSON, an
 * unknown `data_type` — surfaces as `NotFoundError` once the fallback also
 * misses. Reporting "absent" there would turn a corrupt run history into an
 * empty one, and a corrupt mask dataset into every annotation silently losing
 * its geometry.
 *
 * All three markers are checked because a Piximi 2.x archive is v2 on disk
 * (`.zarray`/`.zgroup`) while a new one is v3 (`zarr.json`); probing only
 * `zarr.json` would report every optional node in every existing archive as
 * missing.
 */
export const hasNode = async (root: Group, key: string): Promise<boolean> => {
  const node = child(root, key);
  for (const marker of NODE_MARKERS) {
    if (await root.store.get(node.resolve(marker).path)) return true;
  }
  return false;
};

/**
 * A zero-extent dataset, read as an empty array.
 *
 * zarrita's indexer rejects a selection over a zero-length dimension with
 * `Input contains an empty iterator`, where zarr.js returned an empty array.
 * Real archives rely on the old behaviour: a v0.1 project saved with no
 * annotations has `shape: [0]` on all four annotation datasets.
 */
const readEmpty = (dataset: Dataset, key: string): RawArray => {
  const data = emptyArrayOf(dataset.dtype);
  if (!data) {
    throw new Error(
      `Dataset "${key}" is empty and of unsupported type ${dataset.dtype}`,
    );
  }
  return {
    data,
    shape: [...dataset.shape],
    stride: dataset.shape.map(() => 1),
  };
};

const isEmpty = (dataset: Dataset) =>
  dataset.shape.some((extent) => extent === 0);

/**
 * Read an already-opened dataset in full. Replaces `dataset.getRaw()`, for the
 * legacy readers that need the dataset handle separately to read an attribute
 * off it (`bit_depth` lives on the array, not its parent group).
 */
export const readDataset = async (
  dataset: Dataset,
  key = "<dataset>",
): Promise<RawArray> =>
  isEmpty(dataset)
    ? readEmpty(dataset, key)
    : ((await zarr.get(dataset)) as RawArray);

/** Whole-array read by key. Replaces `(await getDataset(g, k)).getRaw()`. */
export const readWholeArray = async (
  root: Group,
  key: string,
): Promise<RawArray> => readDataset(await getDataset(root, key), key);

/**
 * Read a selection, with a rank check.
 *
 * The check is load-bearing, not defensive. zarr.js padded an under-specified
 * selection out to full rank; zarrita does not, and its `checkSelectionLength`
 * only errors when the selection is *longer* than the rank. A short selection
 * therefore builds a lower-rank indexer, asks for a chunk key that does not
 * exist (`"0"` for a 2-D array stored at `"0.0"`), misses, and returns the fill
 * value — zeros — with no error at all.
 */
export const getDatasetSelection = async (
  root: Group,
  key: string,
  selection: Array<number | null | Slice>,
): Promise<RawArray> => {
  const dataset = await getDataset(root, key);

  if (selection.length !== dataset.shape.length) {
    throw new Error(
      `Selection of rank ${selection.length} does not match dataset "${key}" of rank ${dataset.shape.length}`,
    );
  }

  if (isEmpty(dataset)) return readEmpty(dataset, key);

  return (await zarr.get(dataset, selection)) as RawArray;
};

/**
 * `attrs` is a plain, already-parsed object in zarrita — no fetch, no
 * `containsItem`. Kept async anyway so the ~150 `await getAttr(...)` call sites
 * in `readV2` are untouched, and structurally typed so it still accepts an
 * array as well as a group (the legacy readers read `bit_depth` off a dataset).
 *
 * The presence check is on the key, not the value: falsy scalars are
 * everywhere in this format (`shuffle_B: 0`, `valid_B: 0`, `visible_B: 0`,
 * `num_crops: 0`), and gating on truthiness would reject all of them.
 *
 * Returns `any` to match zarr.js's `attrs.getItem`, which several call sites
 * assign to a typed local with no cast.
 */
export const getAttr = async (
  node: { attrs: Record<string, unknown>; path: string },
  attr: string,
): Promise<any> => {
  if (!(attr in node.attrs)) {
    throw new Error(`Expected attribute "${attr}" in group "${node.path}"`);
  }
  return node.attrs[attr];
};
