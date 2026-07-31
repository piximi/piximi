import { test, expect } from "vitest";

import { data } from "data/test-data/annotatorToolsTestData.json";

import { PenAnnotationTool } from "../tools";
import { AnnotationState } from "../enums";
import { loadTestImage } from "./loadTestImage";

const src = data.image;

// runtime image is RGBA (GPU readback); SLIC/filters index accordingly

test("onMouseDown", () => {
  const image = loadTestImage(src);

  const operator = new PenAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.buffer).toStrictEqual([{ x: 0, y: 0 }]);
});

test("onMouseMove", () => {
  const image = loadTestImage(src);

  const operator = new PenAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.buffer).toStrictEqual([
    {
      x: 0,
      y: 0,
    },
    {
      x: 100,
      y: 100,
    },
  ]);
});

test("onMouseUp-NoMove", () => {
  const image = loadTestImage(src);

  const operator = new PenAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseUp({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationState.Annotated);

  expect(operator.points).toStrictEqual([{ x: 0, y: 0 }]);

  expect(operator.boundingBox).toStrictEqual([0, 0, 8, 8]);

  expect(operator.decodedMask).toBeDefined();
});

test("onMouseUp-Move", () => {
  const image = loadTestImage(src);

  const operator = new PenAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });
  operator.onMouseUp({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationState.Annotated);

  expect(operator.points).toStrictEqual([
    { x: 0, y: 0 },
    { x: 100, y: 100 },
  ]);
  expect(operator.boundingBox).toStrictEqual([0, 0, 107, 107]);

  expect(operator.decodedMask).toBeDefined();
});

test("select", () => {
  const image = loadTestImage(src);

  const operator = new PenAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });
  operator.onMouseUp({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationState.Annotated);
});

test("deselect", () => {
  const image = loadTestImage(src);

  const operator = new PenAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });
  operator.onMouseUp({ x: 100, y: 100 });

  operator.deselect();
  expect(operator.annotationState).toBe(AnnotationState.Blank);
  expect(operator.buffer.length).toBe(0);
  expect(operator.points.length).toBe(0);
});
