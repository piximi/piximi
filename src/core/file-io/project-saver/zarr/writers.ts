import * as zarr from "zarrita";

import { dataTypeOf } from "../../zarr/dtypes";
import { child } from "../../zarr/utils";

import type {
  Group as ZarrGroup,
  Location,
  NumberDataType,
  TypedArray,
} from "zarrita";

import type { WriteStore } from "../../zarr/stores";

export type WritableGroup = ZarrGroup<WriteStore>;

/**
 * Row-major strides, which is what the `Chunk` handed to `zarr.set` carries.
 *
 * Computed here rather than imported: zarrita exports
 * `_zarrita_internal_getStrides`, but that name is a promise not to depend on
 * it. Derived from the shape rather than accepted as a parameter, because
 * `zarr.set` validates strides only as a fast-path check — a wrong stride
 * falls through to an element-wise copy that silently transposes the array.
 */
const rowMajorStrides = (shape: number[]): number[] => {
  const stride = new Array<number>(shape.length);
  let step = 1;
  for (let i = shape.length - 1; i >= 0; i--) {
    stride[i] = step;
    step *= shape[i];
  }
  return stride;
};

/**
 * Replace non-finite numbers with `null` before they reach `.zattrs`.
 *
 * zarrita serializes `NaN`/`Infinity` as the *strings* `"NaN"`/`"Infinity"` as
 * the v3 spec requires, but decodes with a plain `JSON.parse` and no reviver —
 * so they come back as strings, not numbers, and land in number-typed fields
 * where nothing checks them. zarr.js's `JSON.stringify` turned them into
 * `null`, which the readers' `optional()` already handles.
 *
 * This is routine rather than exotic: `evaluateConfusionMatrix` divides by a
 * zero row sum whenever a class receives no predictions, so `NaN` precision
 * and F1 come out of any short or imbalanced run, and the channel statistics
 * have the same shape of problem.
 */
const toJsonSafeAttrs = (
  attrs: Record<string, unknown>,
): Record<string, unknown> =>
  JSON.parse(
    JSON.stringify(attrs, (_key, value) =>
      typeof value === "number" && !Number.isFinite(value) ? null : value,
    ),
  );

/**
 * Create a group together with its attributes.
 *
 * Replaces every `createGroup` + `writeAttrs` pair. Forced by v3 — attributes
 * are only settable at creation, there is no `attrs.put` — but also strictly
 * cheaper: `attrs.put` re-serialized the whole `.zattrs` on every call, and the
 * collection groups here each carry roughly twenty parallel arrays.
 */
export const createGroup = async (
  parent: Location<WriteStore>,
  name: string,
  attrs: Record<string, unknown> = {},
): Promise<WritableGroup> =>
  zarr.create(child(parent, name), { attributes: toJsonSafeAttrs(attrs) });

/**
 * Create the root group. Separate from `createGroup` because the root has no
 * parent name to resolve against, and because its attributes carry the format
 * version that `detectVersion` routes on.
 */
export const createRootGroup = async (
  store: WriteStore,
  attrs: Record<string, unknown>,
): Promise<WritableGroup> =>
  zarr.create(zarr.root(store), { attributes: toJsonSafeAttrs(attrs) });

/**
 * Write a typed array as a single-chunk zarr array under `parent`.
 *
 * - `chunkShape === shape` keeps the whole array in one chunk, matching the old
 *   `chunks: false`. Every array Piximi writes is read back in full — channel
 *   buffers go straight into IndexedDB — so chunking would only add index
 *   entries without buying a partial-read path.
 * - `codecs: []` makes zarrita fall back to a raw little-endian bytes codec,
 *   byte-for-byte what zarr.js's default `compressor: null` produced. The
 *   archive's DEFLATE does the compressing; pixel data barely deflates.
 * - `chunkSeparator: "."` spells the single chunk `<array>/c.0.0`. The v3
 *   default `/` would spell it `<array>/c/0/0`, adding two zip directory
 *   entries per array — and there are two arrays per channel.
 */
export const writeArray = async (
  parent: Location<WriteStore>,
  name: string,
  value: TypedArray<NumberDataType>,
  shape?: number[],
) => {
  const resolvedShape = shape ?? [value.length];
  const dtype = dataTypeOf(value);

  if (!dtype) {
    throw new Error(
      `Cannot write "${name}": unmapped typed array ${value.constructor.name}`,
    );
  }

  // A zero extent gives a chunk grid with no chunks: the write stores nothing
  // and the read comes back as a decode error. Every caller already omits
  // empty arrays (masks when there are no runs, history when a run has no
  // epochs, the confusion matrix when it is 0x0; channel data and histograms
  // are never empty), so this guards against a future missed check rather than
  // a current one.
  if (resolvedShape.some((extent) => extent <= 0)) {
    throw new Error(
      `Cannot write "${name}": degenerate shape [${resolvedShape}]`,
    );
  }

  const expectedBytes =
    resolvedShape.reduce((a, b) => a * b, 1) * value.BYTES_PER_ELEMENT;
  if (value.byteLength !== expectedBytes) {
    throw new Error(
      `Cannot write "${name}": ${value.byteLength} bytes does not match shape [${resolvedShape}] of ${dtype} (${expectedBytes} bytes)`,
    );
  }

  const array = await zarr.create(child(parent, name), {
    shape: resolvedShape,
    chunkShape: resolvedShape,
    chunkSeparator: ".",
    dtype,
    fillValue: 0,
    codecs: [],
  });

  await zarr.set(array, null, {
    data: value,
    shape: resolvedShape,
    stride: rowMajorStrides(resolvedShape),
    // `dtype` is resolved at runtime, so TS widens `array` across the whole
    // numeric union while `Chunk<D>` is invariant in `D`.
  } as never);

  return array;
};
