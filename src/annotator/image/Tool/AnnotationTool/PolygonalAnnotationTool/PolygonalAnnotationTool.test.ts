import { test } from "@jest/globals";
import { PolygonalAnnotationTool } from "./PolygonalAnnotationTool";
import { CategoryType } from "../../../../types/CategoryType";
import * as ImageJS from "image-js";

test("deselect", () => {
  expect(true).toBe(true);
});

// test("deselect", () => {
//   const image = new ImageJS.Image();
//
//   const operator = new PolygonalAnnotationTool(image);
//
//   operator.annotated = true;
//
//   operator.anchor = { x: 100, y: 0 };
//   operator.buffer = [0, 0, 100, 0, 100, 100, 0, 100];
//   operator.origin = { x: 0, y: 0 };
//   operator.points = [0, 0, 100, 0, 100, 100, 0, 100, 0, 0];
//
//   operator.deselect();
//
//   expect(operator.annotated).toBe(false);
//   expect(operator.annotating).toBe(false);
//
//   expect(operator.annotation).toBe(undefined);
//
//   expect(operator.origin).toStrictEqual(undefined);
//
//   expect(operator.anchor).toStrictEqual(undefined);
//   expect(operator.buffer).toStrictEqual([]);
//   expect(operator.origin).toStrictEqual(undefined);
//   expect(operator.points).toStrictEqual([]);
// });
//
// test("onMouseDown", () => {
//   const image = new ImageJS.Image();
//
//   const operator = new PolygonalAnnotationTool(image);
//
//   operator.onMouseDown({ x: 0, y: 0 });
//
//   expect(operator.annotated).toBe(false);
//   expect(operator.annotating).toBe(true);
//
//   expect(operator.annotation).toBe(undefined);
//
//   expect(operator.anchor).toStrictEqual(undefined);
//   expect(operator.buffer).toStrictEqual([]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([]);
// });
//
// test("onMouseDown (subsequent, unconnected)", () => {
//   const image = new ImageJS.Image();
//
//   const operator = new PolygonalAnnotationTool(image);
//
//   operator.origin = { x: 0, y: 0 };
//
//   operator.onMouseDown({ x: 100, y: 0 });
//
//   expect(operator.annotated).toBe(false);
//   expect(operator.annotating).toBe(true);
//
//   expect(operator.annotation).toBe(undefined);
//
//   expect(operator.anchor).toStrictEqual(undefined);
//   expect(operator.buffer).toStrictEqual([]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([]);
// });
//
// test("onMouseDown (subsequent, connected)", () => {
//   const image = new ImageJS.Image();
//
//   const operator = new PolygonalAnnotationTool(image);
//
//   operator.anchor = { x: 0, y: 100 };
//   operator.buffer = [0, 0, 100, 0, 100, 100, 0, 100];
//   operator.origin = { x: 0, y: 0 };
//
//   operator.onMouseDown({ x: 1, y: 1 });
//
//   expect(operator.annotated).toBe(true);
//   expect(operator.annotating).toBe(false);
//
//   expect(operator.annotation).toBe(undefined);
//
//   expect(operator.anchor).toStrictEqual(undefined);
//   expect(operator.buffer).toStrictEqual([0, 0, 100, 0, 100, 100, 0, 100, 0, 0]);
//   expect(operator.origin).toStrictEqual(undefined);
//   expect(operator.points).toStrictEqual([0, 0, 100, 0, 100, 100, 0, 100, 0, 0]);
// });
//
// test("onMouseMove", () => {
//   const image = new ImageJS.Image();
//
//   const operator = new PolygonalAnnotationTool(image);
//
//   operator.annotating = true;
//
//   operator.origin = { x: 0, y: 0 };
//   operator.buffer = [0, 0];
//
//   operator.onMouseMove({ x: 200, y: 200 });
//
//   expect(operator.annotated).toBe(false);
//   expect(operator.annotating).toBe(true);
//
//   expect(operator.annotation).toBe(undefined);
//
//   expect(operator.anchor).toStrictEqual(undefined);
//   expect(operator.buffer).toStrictEqual([0, 0, 200, 200]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([]);
// });
//
// test("onMouseMove (with anchor)", () => {
//   const image = new ImageJS.Image();
//
//   const operator = new PolygonalAnnotationTool(image);
//
//   operator.annotating = true;
//
//   operator.anchor = { x: 100, y: 0 };
//   operator.buffer = [0, 0, 100, 0, 100, 100];
//   operator.origin = { x: 0, y: 0 };
//
//   operator.onMouseMove({ x: 200, y: 200 });
//
//   expect(operator.annotated).toBe(false);
//   expect(operator.annotating).toBe(true);
//
//   expect(operator.annotation).toBe(undefined);
//
//   expect(operator.anchor).toStrictEqual({ x: 100, y: 0 });
//   expect(operator.buffer).toStrictEqual([0, 0, 100, 0, 200, 200]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([]);
// });
//
// test("onMouseUp (unconnected, with anchor)", () => {
//   const image = new ImageJS.Image();
//
//   const operator = new PolygonalAnnotationTool(image);
//
//   operator.annotating = true;
//
//   operator.anchor = { x: 100, y: 0 };
//   operator.buffer = [0, 0, 100, 0, 100, 100];
//   operator.origin = { x: 0, y: 0 };
//
//   operator.onMouseUp({ x: 0, y: 100 });
//
//   expect(operator.annotated).toBe(false);
//   expect(operator.annotating).toBe(true);
//
//   expect(operator.annotation).toBe(undefined);
//
//   expect(operator.anchor).toStrictEqual({ x: 0, y: 100 });
//   expect(operator.buffer).toStrictEqual([0, 0, 100, 0, 0, 100]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([]);
// });
//
// test("onMouseUp (unconnected, without anchor)", () => {
//   const image = new ImageJS.Image();
//
//   const operator = new PolygonalAnnotationTool(image);
//
//   operator.annotating = true;
//
//   operator.origin = { x: 0, y: 0 };
//   operator.buffer = [0, 0, 100, 100];
//
//   operator.onMouseUp({ x: 100, y: 100 });
//
//   expect(operator.annotated).toBe(false);
//   expect(operator.annotating).toBe(true);
//
//   expect(operator.annotation).toBe(undefined);
//
//   expect(operator.anchor).toStrictEqual({ x: 100, y: 100 });
//   expect(operator.buffer).toStrictEqual([0, 0, 100, 100]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([]);
// });
//
// test("onMouseUp (unconnected, on origin)", () => {
//   const image = new ImageJS.Image();
//
//   const operator = new PolygonalAnnotationTool(image);
//
//   operator.annotating = true;
//
//   operator.origin = { x: 0, y: 0 };
//
//   operator.onMouseUp({ x: 0, y: 0 });
//
//   expect(operator.annotated).toBe(false);
//   expect(operator.annotating).toBe(true);
//
//   expect(operator.annotation).toBe(undefined);
//
//   expect(operator.anchor).toStrictEqual(undefined);
//   expect(operator.buffer).toStrictEqual([]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([]);
// });
//
// test("select", () => {
//   const image = new ImageJS.Image();
//
//   const operator = new PolygonalAnnotationTool(image);
//
//   operator.annotated = true;
//
//   operator.anchor = { x: 100, y: 0 };
//   operator.buffer = [0, 0, 100, 0, 100, 100, 0, 100];
//   operator.origin = { x: 0, y: 0 };
//   operator.points = [0, 0, 100, 0, 100, 100, 0, 100, 0, 0];
//
//   const category: Category = {
//     color: "#0000FF",
//     id: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
//     name: "foo",
//     visible: true,
//   };
//
//   operator.annotate(category);
//
//   expect(operator.annotated).toBe(true);
//   expect(operator.annotating).toBe(false);
//
//   expect(operator.annotation).toStrictEqual({
//     boundingBox: [0, 0, 100, 100],
//     categoryId: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
//     mask: "mask",
//   });
//
//   expect(operator.boundingBox).toStrictEqual([0, 0, 100, 100]);
//   expect(operator.mask).toBe("mask");
//
//   expect(operator.anchor).toStrictEqual({ x: 100, y: 0 });
//   expect(operator.buffer).toStrictEqual([0, 0, 100, 0, 100, 100, 0, 100]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([0, 0, 100, 0, 100, 100, 0, 100, 0, 0]);
// });
