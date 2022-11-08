import { test } from "@jest/globals";
import { Image } from "image-js";
import { data } from "../testData.json";
import { PenAnnotationTool } from "./PenAnnotationTool";
import { AnnotationStateType, Category } from "types";

const src = data.image;

test("onMouseDown", async () => {
  const image = await Image.load(src);

  const operator = new PenAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);

  expect(operator.buffer).toStrictEqual([{ x: 0, y: 0 }]);
});

test("onMouseMove", async () => {
  const image = await Image.load(src);

  const operator = new PenAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);

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

test("onMouseUp-NoMove", async () => {
  const image = await Image.load(src);

  const operator = new PenAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  //operator.onMouseMove({ x: 100, y: 100 });
  operator.onMouseUp({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);

  expect(operator.annotation).toBe(undefined);

  expect(operator.points).toStrictEqual([{ x: 0, y: 0 }]);

  expect(operator.boundingBox).toStrictEqual([0, 0, 8, 8]);

  expect(operator.maskData).toBeDefined();
});

test("onMouseUp-Move", async () => {
  const image = await Image.load(src);

  const operator = new PenAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });
  operator.onMouseUp({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);

  expect(operator.annotation).toBe(undefined);

  expect(operator.points).toStrictEqual([
    { x: 0, y: 0 },
    { x: 100, y: 100 },
  ]);
  expect(operator.boundingBox).toStrictEqual([0, 0, 107, 107]);

  expect(operator.maskData).toBeDefined();
});

test("select", async () => {
  const image = await Image.load(src);

  const operator = new PenAnnotationTool(image);

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

  expect(operator.annotation).toMatchObject({
    boundingBox: [0, 0, 107, 107],
    categoryId: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    plane: 1,
  });
});

test("deselect", async () => {
  const image = await Image.load(src);

  const operator = new PenAnnotationTool(image);

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
  expect(operator.buffer.length).toBe(0);
  expect(operator.points.length).toBe(0);
});
