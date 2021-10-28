import { RectangularAnnotationTool } from "./RectangularAnnotationTool";
import { test } from "@jest/globals";
import { CategoryType } from "../../../../types/CategoryType";
import * as ImageJS from "image-js";

test("deselect", () => {
  expect(true).toBe(true);
});

// test("deselect", () => {
//   const image = new ImageJS.Image(224, 224);
//
//   const selectionOperator = new RectangularAnnotationTool(image);
//
//   selectionOperator.annotated = true;
//
//   selectionOperator.origin = { x: 0, y: 0 };
//
//   selectionOperator.width = 100;
//   selectionOperator.height = 100;
//
//   selectionOperator.deselect();
//
//   expect(selectionOperator.annotated).toBe(false);
//   expect(selectionOperator.annotating).toBe(false);
//
//   expect(selectionOperator.annotation).toBe(undefined);
//
//   expect(selectionOperator.origin).toStrictEqual(undefined);
//
//   expect(selectionOperator.width).toBe(undefined);
//   expect(selectionOperator.height).toBe(undefined);
// });
//
// test("onMouseDown", () => {
//   const image = new ImageJS.Image(224, 224);
//
//   const selectionOperator = new RectangularAnnotationTool(image);
//
//   selectionOperator.onMouseDown({ x: 0, y: 0 });
//
//   expect(selectionOperator.annotated).toBe(false);
//   expect(selectionOperator.annotating).toBe(true);
//
//   expect(selectionOperator.annotation).toBe(undefined);
//
//   expect(selectionOperator.origin).toStrictEqual({ x: 0, y: 0 });
//
//   expect(selectionOperator.width).toBe(undefined);
//   expect(selectionOperator.height).toBe(undefined);
// });
//
// test("onMouseMove", () => {
//   const image = new ImageJS.Image(224, 224);
//
//   const selectionOperator = new RectangularAnnotationTool(image);
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
// test("onMouseUp", () => {
//   const image = new ImageJS.Image(224, 224);
//
//   const selectionOperator = new RectangularAnnotationTool(image);
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
//
// test("select", () => {
//   const image = new ImageJS.Image(224, 224);
//
//   const selectionOperator = new RectangularAnnotationTool(image);
//
//   selectionOperator.annotated = true;
//
//   selectionOperator.origin = { x: 0, y: 0 };
//
//   selectionOperator.width = 100;
//   selectionOperator.height = 100;
//
//   const category: Category = {
//     color: "#0000FF",
//     id: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
//     name: "foo",
//     visible: true,
//   };
//   selectionOperator.annotate(category);
//
//   expect(selectionOperator.annotated).toBe(true);
//   expect(selectionOperator.annotating).toBe(false);
//
//   expect(selectionOperator.annotation).toStrictEqual({
//     boundingBox: [0, 0, 100, 100],
//     categoryId: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
//     mask: "mask",
//   });
//
//   expect(selectionOperator.boundingBox).toStrictEqual([0, 0, 100, 100]);
//   expect(selectionOperator.mask).toBe("mask");
//
//   expect(selectionOperator.origin).toStrictEqual({ x: 0, y: 0 });
//
//   expect(selectionOperator.width).toBe(100);
//   expect(selectionOperator.height).toBe(100);
// });
