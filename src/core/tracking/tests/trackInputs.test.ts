import { describe, expect, it } from "vitest";

import { buildTrackInputs } from "../trackInputs";

import type { AnnotationObject, AnnotationVolume, BBox } from "core/entities";

const volume = (
  id: string,
  overrides: Partial<AnnotationVolume> = {},
): AnnotationVolume =>
  ({
    id,
    imageId: "image",
    kindId: "kind",
    categoryId: "category",
    ...overrides,
  }) as AnnotationVolume;

const plane = (
  id: string,
  volumeId: string,
  boundingBox: BBox,
  encodedMask: number[],
): AnnotationObject =>
  ({ id, volumeId, boundingBox, encodedMask }) as AnnotationObject;

const images = { image: { timepoint: 4 } };

describe("buildTrackInputs", () => {
  it("offsets the center by the bounding box origin", () => {
    // 2x2 box with every pixel set: local center is (0.5, 0.5)
    const [input] = buildTrackInputs(
      [volume("v", { timepoint: 1 })],
      [plane("p", "v", [10, 20, 12, 22], [0, 4])],
      images,
    );

    expect(input.center).toEqual({ x: 10.5, y: 20.5 });
  });

  it("prefers an already decoded mask", () => {
    const annotation = plane("p", "v", [0, 0, 2, 1], [0, 2]);
    annotation.decodedMask = new Uint8Array([0, 1]);

    const [input] = buildTrackInputs(
      [volume("v", { timepoint: 1 })],
      [annotation],
      images,
    );

    expect(input.center).toEqual({ x: 1, y: 0 });
  });

  it("unions plane boxes and weights the center by plane mass", () => {
    const [input] = buildTrackInputs(
      [volume("v", { timepoint: 1 })],
      [
        // 1 pixel at (0, 0)
        plane("small", "v", [0, 0, 1, 1], [0, 1]),
        // 3 pixels centered on (11, 0)
        plane("large", "v", [10, 0, 13, 1], [0, 3]),
      ],
      images,
    );

    expect(input.boundingBox).toEqual([0, 0, 13, 1]);
    expect(input.center).toEqual({ x: 33 / 4, y: 0 });
  });

  it("falls back to the image timepoint", () => {
    const [input] = buildTrackInputs(
      [volume("v")],
      [plane("p", "v", [0, 0, 1, 1], [0, 1])],
      images,
    );

    expect(input.timepoint).toBe(4);
  });

  it("keeps volume timepoint 0 over the image timepoint", () => {
    const [input] = buildTrackInputs(
      [volume("v", { timepoint: 0 })],
      [plane("p", "v", [0, 0, 1, 1], [0, 1])],
      images,
    );

    expect(input.timepoint).toBe(0);
  });

  it("skips volumes with no plane annotations", () => {
    expect(buildTrackInputs([volume("v")], [], images)).toEqual([]);
  });
});

describe("buildTrackInputs edge cases", () => {
  it("skips volumes without a known timepoint", () => {
    expect(
      buildTrackInputs(
        [volume("v", { imageId: "missing" })],
        [plane("p", "v", [0, 0, 1, 1], [0, 1])],
        images,
      ),
    ).toEqual([]);
  });

  it("uses the box center for an empty mask", () => {
    const [input] = buildTrackInputs(
      [volume("v")],
      [plane("p", "v", [10, 10, 12, 14], [8])],
      images,
    );

    expect(input.center).toEqual({ x: 11, y: 12 });
  });
});
