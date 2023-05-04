import { test } from "@jest/globals";
import { Image } from "image-js";
import { LassoAnnotationTool } from "./LassoAnnotationTool";
import { AnnotationStateType, Category } from "types";
import { data } from "data/test-data/annotatorToolsTestData.json";

const src = data.image;

test("onMouseDown", async () => {
  const image = await Image.load(src);

  const operator = new LassoAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);

  expect(operator.anchor).toStrictEqual(undefined);
  expect(operator.buffer).toStrictEqual([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]);
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
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
    { x: 4, y: 4 },
    { x: 5, y: 5 },
    { x: 0, y: 0 },
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
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
    { x: 4, y: 4 },
    { x: 5, y: 5 },
    { x: 0, y: 0 },
  ]);
  expect(operator.boundingBox).toStrictEqual([0, 0, 5, 5]);
  expect(operator.maskData).toBeDefined();

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

  operator.annotate(category, 1, "");

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);

  expect(operator.annotation).toMatchObject({
    boundingBox: [0, 0, 5, 5],
    categoryId: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    plane: 1,
    imageId: "",
  });

  expect(operator.boundingBox).toStrictEqual([0, 0, 5, 5]);
  expect(operator.maskData).toBeDefined();

  expect(operator.anchor).toBe(undefined);
  expect(operator.buffer).toStrictEqual([]);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.points).toStrictEqual([
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
    { x: 4, y: 4 },
    { x: 5, y: 5 },
    { x: 0, y: 0 },
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

  operator.annotate(category, 1, "");
  operator.deselect();

  expect(operator.annotationState).toBe(AnnotationStateType.Blank);

  expect(operator.annotation).toBe(undefined);

  expect(operator.boundingBox).toStrictEqual([0, 0, 5, 5]);
  expect(operator.maskData).toBeDefined();

  expect(operator.anchor).toBe(undefined);
  expect(operator.buffer).toStrictEqual([]);
  expect(operator.origin).toBe(undefined);
  expect(operator.points).toStrictEqual([]);
});

test("makeCircle", async () => {
  const image = await Image.load(src);

  const operator = new LassoAnnotationTool(image);

  const origin = 50;
  const radius = 25;
  const marks = 50;
  operator.onMouseDown({ x: origin + radius, y: origin });

  for (let i = 0; i <= marks; i++) {
    operator.onMouseMove({
      x: origin + radius * Math.cos((2 * Math.PI * i) / marks),
      y: origin + radius * Math.sin((2 * Math.PI * i) / marks),
    });
  }
  operator.onMouseMove({ x: origin + radius, y: origin });
  operator.onMouseUp({ x: origin + radius, y: origin });
});
