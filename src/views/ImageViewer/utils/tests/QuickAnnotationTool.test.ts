import { test, expect } from "vitest";
import { decodeJpeg } from "image-js-latest";

import { data } from "data/test-data/annotatorToolsTestData.json";

import { QuickAnnotationTool } from "../tools";
import { AnnotationState } from "../enums";

const src = data.image;

// Match what the app feeds the tool: a RGBA IJSImage (the runtime image comes
// from GPU readback as RGBA, and SLIC indexes data[4*i]). JPEG decodes to RGB,
// so convert.
const loadTestImage = (dataUrl: string) =>
  decodeJpeg(
    Uint8Array.from(Buffer.from(dataUrl.split(",")[1], "base64")),
  ).convertColor("RGBA");

test("initializeSuperPixels", async () => {
  const image = loadTestImage(src);

  const operator = new QuickAnnotationTool(image);

  operator.initializeSuperpixels(30);

  expect(operator.regionSize).toBe(30);

  expect(operator.superpixels).toBeDefined();
  expect(Object.keys(operator.superpixelsMap!).length).toBeGreaterThan(0);
});

test("onMouseMove", async () => {
  const image = loadTestImage(src);

  const operator = new QuickAnnotationTool(image);
  operator.initializeSuperpixels(30);

  operator.onMouseMove({ x: 100, y: 100 });

  expect(operator.currentMask).toBeDefined();

  // live preview raster is produced for the touched region
  expect(operator.overlayData.length).toBeGreaterThan(0);
  expect(operator.overlayBoundingBox).toBeDefined();
});

test("onMouseDown", async () => {
  const image = loadTestImage(src);

  const operator = new QuickAnnotationTool(image);
  operator.initializeSuperpixels(30);

  operator.onMouseMove({ x: 100, y: 100 });
  operator.onMouseDown({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);
});

test("onMouseUp", async () => {
  const image = loadTestImage(src);

  const operator = new QuickAnnotationTool(image);
  operator.initializeSuperpixels(30);

  operator.onMouseDown({ x: 100, y: 100 });

  operator.onMouseMove({ x: 200, y: 200 });

  operator.onMouseUp({ x: 200, y: 200 });

  expect(operator.annotationState).toBe(AnnotationState.Annotated);

  expect(operator.boundingBox).toStrictEqual([182, 175, 219, 213]);
  expect(operator.decodedMask).toBeDefined();
});

test("onMouseUp (Adding)", async () => {
  const image = loadTestImage(src);

  const operator = new QuickAnnotationTool(image);
  operator.initializeSuperpixels(30);

  operator.onMouseDown({ x: 100, y: 100 });

  operator.onMouseMove({ x: 200, y: 200 });

  operator.onMouseUp({ x: 200, y: 200 });

  operator.onMouseMove({ x: 300, y: 200 });

  operator.onMouseDown({ x: 300, y: 200 });
  operator.onMouseMove({ x: 200, y: 200 });
  operator.onMouseUp({ x: 200, y: 200 });

  expect(operator.annotationState).toBe(AnnotationState.Annotated);

  expect(operator.boundingBox).toStrictEqual([182, 175, 219, 213]);
  expect(operator.decodedMask).toBeDefined();
});

test("deselect", async () => {
  const image = loadTestImage(src);

  const operator = new QuickAnnotationTool(image);
  operator.initializeSuperpixels(30);

  operator.onMouseDown({ x: 100, y: 100 });

  operator.onMouseMove({ x: 200, y: 200 });

  operator.onMouseUp({ x: 200, y: 200 });

  operator.onMouseMove({ x: 300, y: 200 });

  operator.onMouseDown({ x: 300, y: 200 });
  operator.onMouseMove({ x: 200, y: 200 });
  operator.onMouseUp({ x: 200, y: 200 });

  operator.deselect();

  expect(operator.colorMasks).toBe(undefined);
  expect(operator.currentSuperpixels.size).toBe(0);
  expect(operator.lastSuperpixel).toBe(0);
  expect(operator.annotationState).toBe(AnnotationState.Blank);

  // preview state is cleared on deselect
  expect(operator.overlayData).toBe("");
  expect(operator.overlayBoundingBox).toBe(undefined);
});
