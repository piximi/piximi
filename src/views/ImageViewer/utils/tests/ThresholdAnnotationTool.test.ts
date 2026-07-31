import { test, expect } from "vitest";

import { data } from "data/test-data/annotatorToolsTestData.json";

import { ThresholdAnnotationTool } from "../tools";
import { AnnotationState } from "../enums";
import { loadTestImage } from "./loadTestImage";

const src = data.image;

test("onMouseDown", () => {
  const image = loadTestImage(src);

  const operator = new ThresholdAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.width).toBe(undefined);
  expect(operator.height).toBe(undefined);
  expect(operator.points).toStrictEqual([]);
  expect(operator.boundingBox).toBe(undefined);
});
//
test("onMouseMove", () => {
  const image = loadTestImage(src);

  const operator = new ThresholdAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.width).toBe(100);
  expect(operator.height).toBe(100);
});
//
test("onMouseUp", () => {
  const image = loadTestImage(src);

  const operator = new ThresholdAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });

  operator.onMouseUp({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationState.Annotated);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.width).toBe(100);
  expect(operator.height).toBe(100);
  expect(operator.points).toStrictEqual([
    { x: 0, y: 0 },
    { x: 100, y: 100 },
  ]);
  expect(operator.boundingBox).toStrictEqual([0, 0, 100, 100]);
  expect(operator.decodedMask).toBeDefined();
});

test("onMouseUp-NoDrag", () => {
  const image = loadTestImage(src);

  const operator = new ThresholdAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseUp({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationState.Annotated);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.width).toBe(undefined);
  expect(operator.height).toBe(undefined);
  expect(operator.points).toStrictEqual([]);
  expect(operator.boundingBox).toBe(undefined);
  expect(operator.decodedMask).toBe(undefined);
});

test("onMouseMove-NoDrag", () => {
  const image = loadTestImage(src);

  const operator = new ThresholdAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseUp({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationState.Annotated);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.points).toStrictEqual([]);
  expect(operator.boundingBox).toBe(undefined);
  expect(operator.decodedMask).toBe(undefined);
});

test("select", () => {
  const image = loadTestImage(src);

  const operator = new ThresholdAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });

  operator.onMouseUp({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationState.Annotated);
  expect(operator.boundingBox).toStrictEqual([0, 0, 100, 100]);
  expect(operator.decodedMask).toBeDefined();
});

test("deselect", () => {
  const image = loadTestImage(src);

  const operator = new ThresholdAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });

  operator.onMouseUp({ x: 100, y: 100 });

  operator.deselect();

  expect(operator.annotationState).toBe(AnnotationState.Blank);

  //expect(operator.annotation).toBe(undefined);

  expect(operator.origin).toStrictEqual(undefined);

  expect(operator.width).toBe(undefined);
  expect(operator.height).toBe(undefined);
});
