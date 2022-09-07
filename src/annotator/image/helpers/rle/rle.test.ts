import { test } from "@jest/globals";
import { decode, encode } from "./rle";

test("decode", () => {
  const encoded = [0, 6, 1];

  const decoded = Uint8ClampedArray.from([255, 255, 255, 255, 255, 255, 0]);

  expect(decode(encoded)).toStrictEqual(decoded);

  expect(true).toBe(true);
});

test("encode", () => {
  const decoded = Uint8ClampedArray.from([0, 0, 255, 255, 255, 0, 255]);

  const encoded = [2, 3, 1, 1];

  expect(encode(decoded)).toStrictEqual(encoded);
});

// TODO: mock ImageData
test("fromString", () => {});

// TODO: mock ImageData
test("toImageData", () => {});
