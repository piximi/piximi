import { test } from "@jest/globals";
import { Image } from "image-js";
import { AnnotationStateType } from "types";
import { data } from "../testData.json";
import { LassoAnnotationTool } from "./LassoAnnotationTool";

const src = data.image;

test("onMouseDown", async () => {
  const image = await Image.load(src);

  const operator = new LassoAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);

  expect(operator.anchor).toStrictEqual(undefined);
  expect(operator.buffer).toStrictEqual([0, 0]);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.points).toStrictEqual([]);
});

// test("onMouseDown (subsequent, unconnected)", async() => {
//   const image = await Image.load(src);

//   const operator = new LassoAnnotationTool(image);

//   operator.origin = { x: 0, y: 0 };

//   operator.onMouseDown({ x: 100, y: 0 });

//   expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

//   expect(operator.annotation).toBe(undefined);

//   expect(operator.anchor).toStrictEqual(undefined);
//   expect(operator.buffer).toStrictEqual([]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([]);
// });

// test("onMouseDown (subsequent, connected)", async () => {
//   const image = await Image.load(src);

//   const operator = new LassoAnnotationTool(image);

//   operator.anchor = { x: 0, y: 100 };
//   operator.buffer = [0, 0, 100, 0, 100, 100, 0, 100];
//   operator.origin = { x: 0, y: 0 };

//   operator.onMouseDown({ x: 1, y: 1 });

//   expect(operator.annotationState).toBe(AnnotationStateType.Annotated);

//   expect(operator.annotation).toBe(undefined);

//   expect(operator.anchor).toStrictEqual(undefined);
//   expect(operator.buffer).toStrictEqual([0, 0, 100, 0, 100, 100, 0, 100, 0, 0]);
//   expect(operator.origin).toStrictEqual(undefined);
//   expect(operator.points).toStrictEqual([0, 0, 100, 0, 100, 100, 0, 100, 0, 0]);
// });

// test("onMouseMove", async () => {
//   const image = await Image.load(src);

//   const operator = new LassoAnnotationTool(image);

//   operator.annotationState = AnnotationStateType.Annotating;

//   operator.origin = { x: 0, y: 0 };

//   operator.buffer = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];

//   operator.onMouseMove({ x: 5, y: 5 });

//   expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

//   expect(operator.annotation).toBe(undefined);

//   expect(operator.anchor).toStrictEqual(undefined);
//   expect(operator.buffer).toStrictEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([]);
// });

// test("onMouseMove (with anchor)", async () => {
//   const image = await Image.load(src);

//   const operator = new LassoAnnotationTool(image);

//   operator.annotating = true;

//   operator.anchor = { x: 0, y: 3 };
//   operator.buffer = [0, 0, 0, 1, 0, 2, 0, 3, 2, 2];
//   operator.origin = { x: 0, y: 0 };

//   operator.onMouseMove({ x: 5, y: 5 });

//   expect(operator.annotationState).toBe(false);
//   expect(operator.annotating).toBe(true);

//   expect(operator.annotation).toBe(undefined);

//   expect(operator.anchor).toStrictEqual({ x: 0, y: 3 });
//   expect(operator.buffer).toStrictEqual([0, 0, 0, 1, 0, 2, 0, 3, 5, 5]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([]);
// });

// test("onMouseUp (unconnected, with anchor)", async () => {
//   const image = await Image.load(src);

//   const operator = new LassoAnnotationTool(image);

//   operator.annotating = true;

//   operator.anchor = { x: 100, y: 0 };
//   operator.buffer = [0, 0, 100, 0, 100, 100];
//   operator.origin = { x: 0, y: 0 };

//   operator.onMouseUp({ x: 0, y: 100 });

//   expect(operator.annotationState).toBe(false);
//   expect(operator.annotating).toBe(true);

//   expect(operator.annotation).toBe(undefined);

//   expect(operator.anchor).toStrictEqual({ x: 0, y: 100 });
//   expect(operator.buffer).toStrictEqual([0, 0, 100, 0, 0, 100]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([]);
// });

// test("onMouseUp (unconnected, without anchor)", async () => {
//   const image = await Image.load(src);

//   const operator = new LassoAnnotationTool(image);

//   operator.annotating = true;

//   operator.buffer = [0, 0, 1, 1, 2, 2, 3, 3];
//   operator.origin = { x: 0, y: 0 };

//   operator.onMouseUp({ x: 3, y: 3 });

//   expect(operator.annotationState).toBe(false);
//   expect(operator.annotating).toBe(true);

//   expect(operator.annotation).toBe(undefined);

//   expect(operator.anchor).toStrictEqual({ x: 3, y: 3 });
//   expect(operator.buffer).toStrictEqual([0, 0, 1, 1, 2, 2, 3, 3]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([]);
// });

// test("select", async () => {
//   const image = await Image.load(src);

//   const operator = new LassoAnnotationTool(image);

//   operator.annotationState = true;

//   operator.anchor = { x: 3, y: 3 };
//   operator.buffer = [0, 0, 1, 1, 2, 2, 3, 3, 4, 3, 5, 3];
//   operator.origin = { x: 0, y: 0 };
//   operator.points = [0, 0, 1, 1, 2, 2, 3, 3, 4, 3, 5, 3, 0, 0];

//   const category: Category = {
//     color: "#0000FF",
//     id: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
//     name: "foo",
//     visible: true,
//   };

//   operator.annotate(category);

//   expect(operator.annotationState).toBe(true);
//   expect(operator.annotating).toBe(false);

//   expect(operator.annotation).toStrictEqual({
//     boundingBox: [0, 0, 5, 3],
//     categoryId: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
//     mask: "mask",
//   });

//   expect(operator.boundingBox).toStrictEqual([0, 0, 5, 3]);
//   expect(operator.mask).toBe("mask");

//   expect(operator.anchor).toStrictEqual({ x: 3, y: 3 });
//   expect(operator.buffer).toStrictEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 3, 5, 3]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([
//     0,
//     0,
//     1,
//     1,
//     2,
//     2,
//     3,
//     3,
//     4,
//     3,
//     5,
//     3,
//     0,
//     0,
//   ]);
// });

// test("deselect", async () => {
//   const image = await Image.load(src);

//   const operator = new LassoAnnotationTool(image);

//   operator.annotationState = true;

//   operator.anchor = { x: 3, y: 3 };
//   operator.buffer = [0, 0, 1, 1, 2, 2, 3, 3, 4, 3, 5, 3];
//   operator.origin = { x: 0, y: 0 };
//   operator.points = [0, 0, 1, 1, 2, 2, 3, 3, 4, 3, 5, 3, 0, 0];

//   operator.deselect();

//   expect(operator.annotationState).toBe(false);
//   expect(operator.annotating).toBe(false);

//   expect(operator.annotation).toBe(undefined);

//   expect(operator.origin).toStrictEqual(undefined);

//   expect(operator.anchor).toStrictEqual(undefined);
//   expect(operator.buffer).toStrictEqual([]);
//   expect(operator.origin).toStrictEqual(undefined);
//   expect(operator.points).toStrictEqual([]);
// });
