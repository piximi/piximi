import { test, expect } from "vitest";

import { data } from "data/test-data/annotatorToolsTestData.json";

import { EllipticalAnnotationTool } from "../tools";
import { AnnotationState } from "../enums";
import { loadTestImage } from "./loadTestImage";

const src = data.image;

test("onMouseDown", () => {
  const image = loadTestImage(src);

  const operator = new EllipticalAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.center).toStrictEqual(undefined);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.radius).toStrictEqual(undefined);
});

test("onMouseMove", () => {
  const image = loadTestImage(src);

  const operator = new EllipticalAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.center).toStrictEqual({ x: 50, y: 50 });
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.radius).toStrictEqual({ x: 50, y: 50 });
});

test("onMouseUp", () => {
  const image = loadTestImage(src);

  const operator = new EllipticalAnnotationTool(image);
  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });
  operator.onMouseUp({ x: 100, y: 100 });

  expect(operator.center).toStrictEqual({ x: 50, y: 50 });
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.radius).toStrictEqual({ x: 50, y: 50 });
  expect(operator.points).toBeDefined();
  expect(operator.points?.length).toBeGreaterThan(0);
  expect(operator.annotationState).toBe(AnnotationState.Annotated);
});

test("select", () => {
  const image = loadTestImage(src);

  const operator = new EllipticalAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });
  operator.onMouseUp({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationState.Annotated);
  expect(operator.boundingBox).toStrictEqual([0, 0, 100, 100]);

  expect(operator.center).toStrictEqual({ x: 50, y: 50 });
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.radius).toStrictEqual({ x: 50, y: 50 });
});

test("deselect", () => {
  const image = loadTestImage(src);

  const operator = new EllipticalAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });
  operator.onMouseUp({ x: 100, y: 100 });
  operator.deselect();

  expect(operator.annotationState).toBe(AnnotationState.Blank);

  expect(operator.center).toStrictEqual(undefined);
  expect(operator.origin).toStrictEqual(undefined);
  expect(operator.radius).toStrictEqual(undefined);
});
