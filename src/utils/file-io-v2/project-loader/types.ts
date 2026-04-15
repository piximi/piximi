/**
 * Raw tensor data as an ArrayBuffer.
 * This replaces Tensor4D in all version types.
 * The buffer is in [Z, H, W, C] layout matching the original tensor shape.
 */
export type RawTensorData = {
  buffer: ArrayBuffer;
  dtype: "float32" | "int32" | "uint8";
  shape: [number, number, number, number]; // [Z, H, W, C]
};
