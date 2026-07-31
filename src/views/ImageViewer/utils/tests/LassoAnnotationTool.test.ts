import { test, expect } from "vitest";

import { data } from "data/test-data/annotatorToolsTestData.json";

import { LassoAnnotationTool } from "../tools";
import { AnnotationState } from "../enums";
import { loadTestImage } from "./loadTestImage";

const src = data.image;

test("onMouseDown", () => {
  const image = loadTestImage(src);

  const operator = new LassoAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.anchor).toStrictEqual(undefined);
  expect(operator.buffer).toStrictEqual([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.points).toStrictEqual([]);
});

test("onMouseMove", () => {
  const image = loadTestImage(src);

  const operator = new LassoAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  for (let i = 1; i <= 5; i++) {
    operator.onMouseMove({ x: i, y: i });
  }

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.anchor).toStrictEqual(undefined);
  expect(operator.buffer).toStrictEqual([
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
    { x: 4, y: 4 },
    { x: 5, y: 5 },
    { x: 0, y: 0 },
  ]);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.points).toStrictEqual([]);
});

test("onMouseUp", () => {
  const image = loadTestImage(src);

  const operator = new LassoAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  for (let i = 1; i <= 5; i++) {
    operator.onMouseMove({ x: i, y: i });
  }

  operator.onMouseUp({ x: 5, y: 5 });

  expect(operator.annotationState).toBe(AnnotationState.Annotated);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.anchor).toStrictEqual(undefined);
  expect(operator.points).toStrictEqual([
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
    { x: 4, y: 4 },
    { x: 5, y: 5 },
    { x: 0, y: 0 },
  ]);
  expect(operator.boundingBox).toStrictEqual([0, 0, 5, 5]);
  expect(operator.decodedMask).toBeDefined();

  expect(operator.buffer).toStrictEqual([]);
});

test("select", () => {
  const image = loadTestImage(src);

  const operator = new LassoAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  for (let i = 1; i <= 5; i++) {
    operator.onMouseMove({ x: i, y: i });
  }

  operator.onMouseUp({ x: 5, y: 5 });

  expect(operator.annotationState).toBe(AnnotationState.Annotated);

  expect(operator.boundingBox).toStrictEqual([0, 0, 5, 5]);
  expect(operator.decodedMask).toBeDefined();

  expect(operator.anchor).toBe(undefined);
  expect(operator.buffer).toStrictEqual([]);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.points).toStrictEqual([
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
    { x: 4, y: 4 },
    { x: 5, y: 5 },
    { x: 0, y: 0 },
  ]);
});

test("deselect", () => {
  const image = loadTestImage(src);

  const operator = new LassoAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  for (let i = 1; i <= 5; i++) {
    operator.onMouseMove({ x: i, y: i });
  }

  operator.onMouseUp({ x: 5, y: 5 });

  operator.deselect();

  expect(operator.annotationState).toBe(AnnotationState.Blank);

  expect(operator.boundingBox).toStrictEqual([0, 0, 5, 5]);
  expect(operator.decodedMask).toBeDefined();

  expect(operator.anchor).toBe(undefined);
  expect(operator.buffer).toStrictEqual([]);
  expect(operator.origin).toBe(undefined);
  expect(operator.points).toStrictEqual([]);
});

test("makeCircle", () => {
  const image = loadTestImage(src);

  const operator = new LassoAnnotationTool(image);

  const origin = 50;
  const radius = 25;
  const marks = 50;
  operator.onMouseDown({ x: origin + radius, y: origin });

  for (let i = 0; i <= marks; i++) {
    operator.onMouseMove({
      x: origin + radius * Math.cos((2 * Math.PI * i) / marks),
      y: origin + radius * Math.sin((2 * Math.PI * i) / marks),
    });
  }
  operator.onMouseMove({ x: origin + radius, y: origin });
  operator.onMouseUp({ x: origin + radius, y: origin });
});
