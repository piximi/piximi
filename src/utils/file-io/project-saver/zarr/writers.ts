import { NestedArray } from "zarr";

import type { Group, ZarrArray } from "zarr";
import type { TypedArray } from "zarr/types/nestedArray/types";
import type { UserAttributes } from "zarr/types/types";

/**
 * Write a typed array as a zarr dataset under `group`.
 *
 * `chunks: false` keeps the whole array in a single chunk. Every array Piximi
 * writes is read back in full — channel buffers go straight into IndexedDB —
 * so chunking would only add index files without buying a partial-read path.
 */
export const writeArray = async (
  group: Group,
  name: string,
  value: TypedArray,
  shape?: number[],
): Promise<ZarrArray> =>
  group.createDataset(
    name,
    undefined,
    new NestedArray(value, shape ?? [value.length]),
    { chunks: false, fillValue: 0 },
  );

/**
 * Replace a group's attributes in a single write.
 *
 * `attrs.setItem` re-serializes the whole `.zattrs` on every call, so setting
 * twenty fields one at a time costs twenty round trips through the store. The
 * collection groups here each carry roughly that many parallel arrays.
 */
export const writeAttrs = async (
  group: Group | ZarrArray,
  attrs: Record<string, unknown>,
): Promise<void> => group.attrs.put(attrs as UserAttributes);
