import type { NumberDataType, TypedArray } from "zarrita";

type NumericArrayConstructor = {
  new (length: number): TypedArray<NumberDataType>;
  readonly BYTES_PER_ELEMENT: number;
};

/**
 * The numeric data types Piximi persists, in both directions.
 *
 * Zarr v3 spells types out (`"uint16"`) where zarr.js used numpy notation
 * (`"<u2"`) and inferred the type from the `NestedArray` it was handed. The
 * writer needs constructor → name to declare an array; the reader needs
 * name → constructor to materialise an empty one. Kept together so the two
 * directions cannot drift.
 *
 * 64-bit integers are deliberately absent: nothing in the format writes them,
 * and an unmapped type should fail loudly rather than be silently widened.
 */
const TYPES: Array<[NumericArrayConstructor, NumberDataType]> = [
  [Int8Array, "int8"],
  [Uint8Array, "uint8"],
  [Int16Array, "int16"],
  [Uint16Array, "uint16"],
  [Int32Array, "int32"],
  [Uint32Array, "uint32"],
  [Float32Array, "float32"],
  [Float64Array, "float64"],
];

const NAME_BY_CTOR = new Map<Function, NumberDataType>(
  TYPES.map(([ctor, name]) => [ctor, name]),
);

const CTOR_BY_NAME = new Map<string, NumericArrayConstructor>(
  TYPES.map(([ctor, name]) => [name, ctor]),
);

/** The v3 `data_type` for a typed array, or `undefined` if unsupported. */
export const dataTypeOf = (
  value: TypedArray<NumberDataType>,
): NumberDataType | undefined => NAME_BY_CTOR.get(value.constructor);

/**
 * An empty typed array of the given data type.
 *
 * Needed because zarrita's indexer rejects a zero-extent selection
 * (`Input contains an empty iterator`), while zarr.js read it as an empty
 * array — and real shipped archives contain `shape: [0]` datasets, e.g. the
 * annotation datasets of any v0.1 project saved with no annotations.
 */
export const emptyArrayOf = (
  dataType: string,
): TypedArray<NumberDataType> | undefined => {
  const ctor = CTOR_BY_NAME.get(dataType);
  return ctor ? new ctor(0) : undefined;
};
