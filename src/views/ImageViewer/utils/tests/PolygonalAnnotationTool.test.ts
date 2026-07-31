import { test, expect } from "vitest";

import { data } from "data/test-data/annotatorToolsTestData.json";

import { PolygonalAnnotationTool } from "../tools";
import { AnnotationState } from "../enums";
import { loadTestImage } from "./loadTestImage";

const src = data.image;

test("onMouseDown", () => {
  const image = loadTestImage(src);

  const operator = new PolygonalAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.anchor).toStrictEqual(undefined);
  expect(operator.buffer).toStrictEqual([{ x: 0, y: 0 }]);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.points).toStrictEqual([]);
});
test("onMouseMove  (origin)", () => {
  const image = loadTestImage(src);

  const operator = new PolygonalAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 200, y: 200 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.anchor).toBe(undefined);
  expect(operator.buffer).toStrictEqual([
    { x: 0, y: 0 },
    { x: 200, y: 200 },
  ]);
});

test("onMouseUp (unconnected)", () => {
  const image = loadTestImage(src);

  const operator = new PolygonalAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 200, y: 200 });
  operator.onMouseUp({ x: 200, y: 200 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);
});

test("onMouseMove (with anchor)", () => {
  const image = loadTestImage(src);

  const operator = new PolygonalAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseUp({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 0 });
  operator.onMouseDown({ x: 100, y: 0 });
  operator.onMouseUp({ x: 100, y: 0 });
  operator.onMouseMove({ x: 200, y: 200 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.buffer).toStrictEqual([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 200, y: 200 },
  ]);
});

test("onMouseUp (connected)", () => {
  const image = loadTestImage(src);

  const operator = new PolygonalAnnotationTool(image);

  operator.onMouseDown({ x: 100, y: 0 });
  operator.onMouseUp({ x: 100, y: 0 });

  operator.onMouseMove({ x: 0, y: 100 });
  operator.onMouseDown({ x: 0, y: 100 });
  operator.onMouseUp({ x: 0, y: 100 });

  operator.onMouseMove({ x: 200, y: 100 });
  operator.onMouseDown({ x: 200, y: 100 });
  operator.onMouseUp({ x: 200, y: 100 });

  operator.onMouseMove({ x: 100, y: 0 });
  operator.onMouseDown({ x: 100, y: 0 });
  operator.onMouseUp({ x: 100, y: 0 });

  expect(operator.annotationState).toBe(AnnotationState.Annotated);

  expect(operator.points).toStrictEqual([
    { x: 100, y: 0 },
    { x: 0, y: 100 },
    { x: 200, y: 100 },
    { x: 100, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 0 },
  ]);

  expect(operator.decodedMask).toBeDefined();
  expect(operator.buffer).toStrictEqual([]);
  expect(operator.origin).toBe(undefined);
  expect(operator.anchor).toBe(undefined);
});

test("select", () => {
  const image = loadTestImage(src);

  const operator = new PolygonalAnnotationTool(image);

  operator.onMouseDown({ x: 100, y: 0 });
  operator.onMouseUp({ x: 100, y: 0 });

  operator.onMouseMove({ x: 0, y: 100 });
  operator.onMouseDown({ x: 0, y: 100 });
  operator.onMouseUp({ x: 0, y: 100 });

  operator.onMouseMove({ x: 200, y: 100 });
  operator.onMouseDown({ x: 200, y: 100 });
  operator.onMouseUp({ x: 200, y: 100 });

  operator.onMouseMove({ x: 100, y: 0 });
  operator.onMouseDown({ x: 100, y: 0 });
  operator.onMouseUp({ x: 100, y: 0 });
});

test("deselect", () => {
  const image = loadTestImage(src);

  const operator = new PolygonalAnnotationTool(image);

  operator.onMouseDown({ x: 100, y: 0 });
  operator.onMouseUp({ x: 100, y: 0 });

  operator.onMouseMove({ x: 0, y: 100 });
  operator.onMouseDown({ x: 0, y: 100 });
  operator.onMouseUp({ x: 0, y: 100 });

  operator.onMouseMove({ x: 200, y: 100 });
  operator.onMouseDown({ x: 200, y: 100 });
  operator.onMouseUp({ x: 200, y: 100 });

  operator.onMouseMove({ x: 100, y: 0 });
  operator.onMouseDown({ x: 100, y: 0 });
  operator.onMouseUp({ x: 100, y: 0 });

  operator.deselect();

  expect(operator.origin).toBe(undefined);
  expect(operator.anchor).toBe(undefined);
  expect(operator.buffer).toStrictEqual([]);
  expect(operator.points).toStrictEqual([]);
  expect(operator.annotationState).toBe(AnnotationState.Blank);
});
//
