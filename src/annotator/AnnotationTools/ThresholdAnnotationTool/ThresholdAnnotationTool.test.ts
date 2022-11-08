import { test } from "@jest/globals";
import { Image } from "image-js";
import { AnnotationStateType, Category } from "types";
import { data } from "../testData.json";
import { ThresholdAnnotationTool } from "./ThresholdAnnotationTool";

const src = data.image;

test("onMouseDown", async () => {
  const image = await Image.load(src);

  const operator = new ThresholdAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.width).toBe(undefined);
  expect(operator.height).toBe(undefined);
  expect(operator.points).toStrictEqual([]);
  expect(operator.boundingBox).toBe(undefined);
});
//
test("onMouseMove", async () => {
  const image = await Image.load(src);

  const operator = new ThresholdAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.width).toBe(100);
  expect(operator.height).toBe(100);
});
//
test("onMouseUp", async () => {
  const image = await Image.load(src);

  const operator = new ThresholdAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });

  operator.onMouseUp({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);

  expect(operator.annotation).toBe(undefined);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.width).toBe(100);
  expect(operator.height).toBe(100);
  expect(operator.points).toStrictEqual([
    { x: 0, y: 0 },
    { x: 100, y: 100 },
  ]);
  expect(operator.boundingBox).toStrictEqual([0, 0, 100, 100]);
  expect(operator.maskData).toBeDefined();
});

test("onMouseUp-NoDrag", async () => {
  const image = await Image.load(src);

  const operator = new ThresholdAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseUp({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);

  expect(operator.annotation).toBe(undefined);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.width).toBe(undefined);
  expect(operator.height).toBe(undefined);
  expect(operator.points).toStrictEqual([]);
  expect(operator.boundingBox).toBe(undefined);
  expect(operator.maskData).toBe(undefined);
});

test("onMouseMove-NoDrag", async () => {
  const image = await Image.load(src);

  const operator = new ThresholdAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseUp({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);

  expect(operator.annotation).toBe(undefined);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.points).toStrictEqual([]);
  expect(operator.boundingBox).toBe(undefined);
  expect(operator.maskData).toBe(undefined);
});

test("select", async () => {
  const image = await Image.load(src);

  const operator = new ThresholdAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });

  operator.onMouseUp({ x: 100, y: 100 });

  const category: Category = {
    color: "#0000FF",
    id: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    name: "foo",
    visible: true,
  };
  operator.annotate(category, 1);

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);
  expect(operator.boundingBox).toStrictEqual([0, 0, 100, 100]);
  expect(operator.maskData).toBeDefined();
  expect(operator.annotation).toMatchObject({
    boundingBox: [0, 0, 100, 100],
    categoryId: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    plane: 1,
  });
});

test("deselect", async () => {
  const image = await Image.load(src);

  const operator = new ThresholdAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });

  operator.onMouseUp({ x: 100, y: 100 });

  const category: Category = {
    color: "#0000FF",
    id: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    name: "foo",
    visible: true,
  };
  operator.annotate(category, 1);

  operator.deselect();

  expect(operator.annotationState).toBe(AnnotationStateType.Blank);

  //expect(operator.annotation).toBe(undefined);

  expect(operator.origin).toStrictEqual(undefined);

  expect(operator.width).toBe(undefined);
  expect(operator.height).toBe(undefined);
});
