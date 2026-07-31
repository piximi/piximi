import { test, expect } from "vitest";

import { data } from "data/test-data/annotatorToolsTestData.json";

import { RectangularAnnotationTool } from "../tools";
import { AnnotationState } from "../enums";
import { loadTestImage } from "./loadTestImage";

const src = data.image;

test("onMouseDown", () => {
  const image = loadTestImage(src);

  const operator = new RectangularAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.width).toBe(undefined);
  expect(operator.height).toBe(undefined);
});

test("onMouseMove", () => {
  const image = loadTestImage(src);

  const operator = new RectangularAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.width).toBe(100);
  expect(operator.height).toBe(100);
});

test("onMouseUp", () => {
  const image = loadTestImage(src);

  const operator = new RectangularAnnotationTool(image);

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

test("make rectangle by clicking twice", () => {
  const image = loadTestImage(src);

  const operator = new RectangularAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseUp({ x: 0, y: 0 });

  operator.onMouseMove({ x: 100, y: 100 });
  operator.onMouseDown({ x: 100, y: 100 });
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

test("select", () => {
  const image = loadTestImage(src);

  const operator = new RectangularAnnotationTool(image);

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

test("deselect", () => {
  const image = loadTestImage(src);

  const operator = new RectangularAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 100, y: 100 });
  operator.onMouseUp({ x: 100, y: 100 });

  operator.deselect();

  expect(operator.annotationState).toBe(AnnotationState.Blank);

  expect(operator.origin).toStrictEqual(undefined);

  expect(operator.width).toBe(undefined);
  expect(operator.height).toBe(undefined);
});
