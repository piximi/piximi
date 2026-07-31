import { test, expect } from "vitest";

import { data } from "data/test-data/annotatorToolsTestData.json";

import { MagneticAnnotationTool } from "../tools";
import { AnnotationState } from "../enums";
import { loadTestImage } from "./loadTestImage";

const src = data.image;

test("onMouseDown (unconnected)", () => {
  const image = loadTestImage(src);

  const operator = new MagneticAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.buffer).toStrictEqual([]);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.points).toStrictEqual([]);
});

test("onMouseMove (from origin)", () => {
  const image = loadTestImage(src);

  const operator = new MagneticAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 300, y: 300 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.buffer[0]).toStrictEqual({ x: 0, y: 0 });
  expect(operator.buffer.at(-1)!).toStrictEqual({
    x: 300,
    y: 300,
  });

  expect(operator.points).toStrictEqual([]);
});

test("onMouseMove (from anchor)", () => {
  const image = loadTestImage(src);

  const operator = new MagneticAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 150, y: 150 });

  operator.onMouseUp({ x: 150, y: 150 });

  operator.onMouseMove({ x: 300, y: 300 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.anchor).toStrictEqual({ x: 150, y: 150 });

  const anchorStart = operator.previous.length;

  expect(operator.buffer[0]).toStrictEqual({ x: 0, y: 0 });
  expect(operator.buffer[anchorStart]).toStrictEqual({ x: 150, y: 150 });
  expect(operator.buffer.at(-1)!).toStrictEqual({
    x: 300,
    y: 300,
  });

  expect(operator.points).toStrictEqual([]);
});

test("onMouseup (unconnected, from origin)", () => {
  const image = loadTestImage(src);

  const operator = new MagneticAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 150, y: 150 });

  operator.onMouseUp({ x: 150, y: 150 });

  operator.onMouseMove({ x: 300, y: 300 });

  operator.onMouseDown({ x: 300, y: 300 });

  operator.onMouseUp({ x: 300, y: 300 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.buffer[0]).toStrictEqual({ x: 0, y: 0 });
  expect(operator.path[0]).toStrictEqual({ x: 150, y: 150 });
  expect(operator.buffer.at(-1)!).toStrictEqual({
    x: 300,
    y: 300,
  });

  expect(operator.anchor).toStrictEqual({ x: 300, y: 300 });

  expect(operator.points).toStrictEqual([]);
});

test("onMouseup (unconnected, from anchor)", () => {
  const image = loadTestImage(src);

  const operator = new MagneticAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 300, y: 300 });

  operator.onMouseUp({ x: 300, y: 300 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.anchor).toStrictEqual({ x: 300, y: 300 });
  expect(operator.buffer[0]).toStrictEqual({ x: 0, y: 0 });
  expect(operator.buffer.at(-1)!).toStrictEqual({
    x: 300,
    y: 300,
  });

  expect(operator.points).toStrictEqual([]);
});

test("onMouseUp (connected)", () => {
  const image = loadTestImage(src);

  const operator = new MagneticAnnotationTool(image);

  operator.onMouseDown({ x: 300, y: 0 });
  operator.onMouseUp({ x: 300, y: 0 });

  operator.onMouseMove({ x: 150, y: 300 });
  operator.onMouseDown({ x: 150, y: 300 });
  operator.onMouseUp({ x: 150, y: 300 });

  operator.onMouseMove({ x: 450, y: 300 });
  operator.onMouseDown({ x: 450, y: 300 });
  operator.onMouseUp({ x: 450, y: 300 });

  operator.onMouseMove({ x: 300, y: 0 });
  operator.onMouseDown({ x: 300, y: 0 });
  operator.onMouseUp({ x: 300, y: 0 });

  expect(operator.annotationState).toBe(AnnotationState.Annotated);

  expect(operator.points[0]).toStrictEqual({ x: 300, y: 0 });
  expect(operator.points.at(-1)!).toStrictEqual({
    x: 300,
    y: 0,
  });
  expect(operator.buffer).toStrictEqual([]);
  expect(operator.origin).toStrictEqual({ x: 300, y: 0 });
  expect(operator.decodedMask).toBeDefined();
});

test("select", () => {
  const image = loadTestImage(src);

  const operator = new MagneticAnnotationTool(image);

  operator.onMouseDown({ x: 300, y: 0 });
  operator.onMouseUp({ x: 300, y: 0 });

  operator.onMouseMove({ x: 150, y: 300 });
  operator.onMouseDown({ x: 150, y: 300 });
  operator.onMouseUp({ x: 150, y: 300 });

  operator.onMouseMove({ x: 450, y: 300 });
  operator.onMouseDown({ x: 450, y: 300 });
  operator.onMouseUp({ x: 450, y: 300 });

  operator.onMouseMove({ x: 300, y: 0 });
  operator.onMouseDown({ x: 300, y: 0 });
  operator.onMouseUp({ x: 300, y: 0 });

  expect(operator.annotationState).toBe(AnnotationState.Annotated);
  expect(operator.boundingBox).toStrictEqual([10, 0, 300, 318]);
  expect(operator.decodedMask).toBeDefined();
});

test("deselect", () => {
  const image = loadTestImage(src);

  const operator = new MagneticAnnotationTool(image);

  operator.onMouseDown({ x: 300, y: 0 });
  operator.onMouseUp({ x: 300, y: 0 });

  operator.onMouseMove({ x: 150, y: 300 });
  operator.onMouseDown({ x: 150, y: 300 });
  operator.onMouseUp({ x: 150, y: 300 });

  operator.onMouseMove({ x: 450, y: 300 });
  operator.onMouseDown({ x: 450, y: 300 });
  operator.onMouseUp({ x: 450, y: 300 });

  operator.onMouseMove({ x: 300, y: 0 });
  operator.onMouseDown({ x: 300, y: 0 });
  operator.onMouseUp({ x: 300, y: 0 });

  operator.deselect();

  expect(operator.anchor).toStrictEqual(undefined);
  expect(operator.buffer).toStrictEqual([]);
  expect(operator.graph).toStrictEqual(undefined);
  expect(operator.origin).toStrictEqual(undefined);
  expect(operator.points).toStrictEqual([]);
  expect(operator.previous).toStrictEqual([]);

  expect(operator.annotationState).toBe(AnnotationState.Blank);
});
