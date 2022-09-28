import { test } from "@jest/globals";
import { Image } from "image-js";
import { AnnotationStateType, Category } from "types";
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
  expect(operator.buffer).toStrictEqual([0, 0, 0, 0]);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.points).toStrictEqual([]);
});

test("onMouseMove", async () => {
  const image = await Image.load(src);

  const operator = new LassoAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  for (let i = 1; i <= 5; i++) {
    operator.onMouseMove({ x: i, y: i });
  }

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);

  expect(operator.anchor).toStrictEqual(undefined);
  expect(operator.buffer).toStrictEqual([
    0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 0, 0,
  ]);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.points).toStrictEqual([]);
});

test("onMouseUp", async () => {
  const image = await Image.load(src);

  const operator = new LassoAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  for (let i = 1; i <= 5; i++) {
    operator.onMouseMove({ x: i, y: i });
  }

  operator.onMouseUp({ x: 5, y: 5 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);

  expect(operator.annotation).toBe(undefined);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.anchor).toStrictEqual(undefined);
  expect(operator.points).toStrictEqual([
    0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 0, 0,
  ]);
  expect(operator.boundingBox).toStrictEqual([0, 0, 5, 5]);
  expect(operator.mask).toBeDefined();

  expect(operator.buffer).toStrictEqual([]);
});

test("select", async () => {
  const image = await Image.load(src);

  const operator = new LassoAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  for (let i = 1; i <= 5; i++) {
    operator.onMouseMove({ x: i, y: i });
  }

  operator.onMouseUp({ x: 5, y: 5 });

  const category: Category = {
    color: "#0000FF",
    id: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    name: "foo",
    visible: true,
  };

  operator.annotate(category, 1);

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);

  expect(operator.annotation).toMatchObject({
    boundingBox: [0, 0, 5, 5],
    categoryId: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    plane: 1,
  });

  expect(operator.boundingBox).toStrictEqual([0, 0, 5, 5]);
  expect(operator.mask).toBeDefined();

  expect(operator.anchor).toBe(undefined);
  expect(operator.buffer).toStrictEqual([]);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.points).toStrictEqual([
    0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 0, 0,
  ]);
});

test("deselect", async () => {
  const image = await Image.load(src);

  const operator = new LassoAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  for (let i = 1; i <= 5; i++) {
    operator.onMouseMove({ x: i, y: i });
  }

  operator.onMouseUp({ x: 5, y: 5 });

  const category: Category = {
    color: "#0000FF",
    id: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    name: "foo",
    visible: true,
  };

  operator.annotate(category, 1);
  operator.deselect();

  expect(operator.annotationState).toBe(AnnotationStateType.Blank);

  expect(operator.annotation).toBe(undefined);

  expect(operator.boundingBox).toStrictEqual([0, 0, 5, 5]);
  expect(operator.mask).toBeDefined();

  expect(operator.anchor).toBe(undefined);
  expect(operator.buffer).toStrictEqual([]);
  expect(operator.origin).toBe(undefined);
  expect(operator.points).toStrictEqual([]);
});

// test("onMouseUp (unconnected, without anchor)", async () => {
//   const image = await Image.load(src);

//   const operator = new LassoAnnotationTool(image);

//   operator.annotationState = AnnotationStateType.Annotating;

//   operator.onMouseDown({ x: 0, y: 0 });

//   for (let i = 1; i <= 5; i++) {
//     operator.onMouseMove({ x: i, y: i });
//   }

//   operator.onMouseUp({ x: 5, y: 5 });

//   expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

//   expect(operator.annotation).toBe(undefined);

//   expect(operator.anchor).toStrictEqual({ x: 5, y: 5 });
//   expect(operator.buffer).toStrictEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([]);
// });

// test("onMouseMove (with anchor)", async () => {
//   console.log("\n\n~~~~ON MOUSE MOVE WITH ANCHOR~~~~\n\n");
//   const image = await Image.load(src);

//   const operator = new LassoAnnotationTool(image);

//   operator.annotationState = AnnotationStateType.Annotating;

//   operator.onMouseDown({ x: 0, y: 0 });
//   operator.onMouseUp({ x: 0, y: 0 });

//   for (let i = 1; i <= 5; i++) {
//     operator.onMouseMove({ x: i, y: i });
//     operator.onMouseMove({ x: 0, y: 0 });
//   }

//   expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

//   expect(operator.annotation).toBe(undefined);

//   expect(operator.anchor).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.buffer).toStrictEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([]);
// });

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
