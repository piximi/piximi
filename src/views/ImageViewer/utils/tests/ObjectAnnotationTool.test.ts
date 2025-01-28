import { test, expect } from "vitest";
import { Image } from "image-js";
import { data } from "data/test-data/annotatorToolsTestData.json";
import { ObjectAnnotationTool } from "../tools";
import { AnnotationState } from "../enums";

const src = data.image;

test("deselect", () => {
  expect(true).toBe(true);
});

test("onMouseDown", async () => {
  const image = await Image.load(src);
  const selectionOperator = new ObjectAnnotationTool(image);

  selectionOperator.onMouseDown({ x: 0, y: 0 });

  expect(selectionOperator.annotationState).toBe(AnnotationState.Annotating);

  expect(selectionOperator.annotation).toBe(undefined);

  expect(selectionOperator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(selectionOperator.width).toBe(undefined);
  expect(selectionOperator.height).toBe(undefined);
});

// test("onMouseMove", async () => {
//   const src =
//
//   const image = await Image.load(src);
//   const selectionOperator = new ObjectAnnotationTool(image);
//
//   selectionOperator.annotating = true;
//
//   selectionOperator.origin = { x: 0, y: 0 };
//
//   selectionOperator.onMouseMove({ x: 100, y: 100 });
//
//   expect(selectionOperator.annotated).toBe(false);
//   expect(selectionOperator.annotating).toBe(true);
//
//   expect(selectionOperator.annotation).toBe(undefined);
//
//   expect(selectionOperator.origin).toStrictEqual({ x: 0, y: 0 });
//
//   expect(selectionOperator.width).toBe(100);
//   expect(selectionOperator.height).toBe(100);
// });
//
// test("onMouseUp", async () => {
//   const src =
//
//   const image = await Image.load(src);
//   const selectionOperator = new ObjectAnnotationTool(image);
//
//   selectionOperator.annotating = true;
//
//   selectionOperator.origin = { x: 0, y: 0 };
//
//   selectionOperator.onMouseUp({ x: 100, y: 100 });
//
//   expect(selectionOperator.annotated).toBe(true);
//   expect(selectionOperator.annotating).toBe(false);
//
//   expect(selectionOperator.annotation).toBe(undefined);
//
//   expect(selectionOperator.origin).toStrictEqual({ x: 0, y: 0 });
//
//   expect(selectionOperator.width).toBe(100);
//   expect(selectionOperator.height).toBe(100);
// });
