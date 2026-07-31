import { test, expect, describe, it } from "vitest";

import { data } from "data/test-data/annotatorToolsTestData.json";

import { ColorAnnotationTool } from "../tools/ColorAnnotationTool";
import { AnnotationState } from "../enums";
import { loadTestImage } from "./loadTestImage";

describe("onMouseDown", () => {
  const src = data.image;

  it("sets the origin", async () => {
    const image = loadTestImage(src);
    const operator = new ColorAnnotationTool(image);

    operator.onMouseDown({ x: 0, y: 0 });

    expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

    expect(operator.toleranceQueue.length).toBeGreaterThan(0);
    expect(operator.seen.size).toBeGreaterThan(0);
    expect(operator.overlayData.length).toBeGreaterThan(0);

    expect(operator.annotationState).toBe(AnnotationState.Annotating);
  });
  it("sets the tool tip position", async () => {
    const image = loadTestImage(src);
    const operator = new ColorAnnotationTool(image);

    operator.onMouseDown({ x: 0, y: 0 });

    expect(operator.toolTipPosition).toStrictEqual({ x: 0, y: 0 });
  });
  it("creates a tolerance map", async () => {
    const image = loadTestImage(src);
    const operator = new ColorAnnotationTool(image);

    operator.onMouseDown({ x: 0, y: 0 });

    expect(operator.toleranceMap).toBeDefined();
  });
  it("creates a flood map", async () => {
    const image = loadTestImage(src);
    const operator = new ColorAnnotationTool(image);

    operator.onMouseDown({ x: 0, y: 0 });

    expect(operator.floodMap).toBeDefined();
  });
  it("initializes a tolerance Queue", async () => {
    const image = loadTestImage(src);
    const operator = new ColorAnnotationTool(image);
    operator.onMouseDown({ x: 0, y: 0 });
    expect(operator.toleranceQueue.length).toBe(8);
  });
  it("initializes the seen array", async () => {
    const image = loadTestImage(src);
    const operator = new ColorAnnotationTool(image);

    operator.onMouseDown({ x: 0, y: 0 });

    expect(operator.seen.size).toBe(18);
  });
});

test("onMouseMove", async () => {
  const src = data.image;

  const image = loadTestImage(src);

  const operator = new ColorAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 20, y: 0 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.toolTipPosition).toStrictEqual({ x: 20, y: 0 });
});

test("onMouseUp", async () => {
  const src = data.image;

  const image = loadTestImage(src);

  const operator = new ColorAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 20, y: 0 });

  operator.onMouseUp({ x: 20, y: 0 });

  expect(operator.annotationState).toBe(AnnotationState.Annotated);

  expect(operator.roiManager).toBeDefined();
  expect(operator.roiMask).toBeDefined();
  expect(operator.boundingBox).toStrictEqual([0, 0, 107, 52]);
  expect(operator.decodedMask).toBeDefined();
});

test("select", async () => {
  const src = data.image;
  const image = loadTestImage(src);

  const operator = new ColorAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 20, y: 0 });

  operator.onMouseUp({ x: 20, y: 0 });

  expect(operator.annotationState).toBe(AnnotationState.Annotated);
  expect(operator.boundingBox).toStrictEqual([0, 0, 107, 52]);
});

test("deselect", async () => {
  const src = data.image;
  const image = loadTestImage(src);

  const operator = new ColorAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 20, y: 0 });

  operator.onMouseUp({ x: 20, y: 0 });

  operator.deselect();

  expect(operator.overlayData).toBe("");

  expect(operator.roiManager).toBe(undefined);
  expect(operator.roiMask).toBe(undefined);

  expect(operator.points).toStrictEqual([]);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.toolTipPosition).toBe(undefined);

  expect(operator.tolerance).toBe(1);
  expect(operator.toleranceMap).toBe(undefined);
  expect(operator.toleranceQueue.length).toBe(0);
  expect(operator.seen.size).toBe(0);

  expect(operator.annotationState).toBe(AnnotationState.Blank);
});
