import { test, expect } from "vitest";
import { Image } from "image-js";
import { data } from "data/test-data/annotatorToolsTestData.json";
import { RectangularAnnotationTool } from "../tools";
import { AnnotationState } from "../enums";
import { Category } from "store/data/types";

const src = data.image;

test("onMouseDown", async () => {
  const image = await Image.load(src);

  const operator = new RectangularAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.annotation).toBe(undefined);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.width).toBe(undefined);
  expect(operator.height).toBe(undefined);
});

test("onMouseMove", async () => {
  const image = await Image.load(src);

  const operator = new RectangularAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.annotation).toBe(undefined);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.width).toBe(100);
  expect(operator.height).toBe(100);
});

test("onMouseUp", async () => {
  const image = await Image.load(src);

  const operator = new RectangularAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 100, y: 100 });
  operator.onMouseUp({ x: 100, y: 100 });
  expect(operator.annotationState).toBe(AnnotationState.Annotated);

  expect(operator.annotation).toBe(undefined);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.width).toBe(100);
  expect(operator.height).toBe(100);

  expect(operator.points).toStrictEqual([
    { x: 0, y: 0 },
    { x: 100, y: 100 },
  ]);
  expect(operator.boundingBox).toStrictEqual([0, 0, 100, 100]);
  expect(operator.decodedMask).toBeDefined();
});

test("make rectangle by clicking twice", async () => {
  const image = await Image.load(src);

  const operator = new RectangularAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseUp({ x: 0, y: 0 });

  operator.onMouseMove({ x: 100, y: 100 });
  operator.onMouseDown({ x: 100, y: 100 });
  operator.onMouseUp({ x: 100, y: 100 });
  expect(operator.annotationState).toBe(AnnotationState.Annotated);

  expect(operator.annotation).toBe(undefined);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.width).toBe(100);
  expect(operator.height).toBe(100);

  expect(operator.points).toStrictEqual([
    { x: 0, y: 0 },
    { x: 100, y: 100 },
  ]);
  expect(operator.boundingBox).toStrictEqual([0, 0, 100, 100]);
  expect(operator.decodedMask).toBeDefined();
});

test("select", async () => {
  const image = await Image.load(src);

  const operator = new RectangularAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 100, y: 100 });
  operator.onMouseUp({ x: 100, y: 100 });

  const category: Category = {
    color: "#0000FF",
    id: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    name: "foo",
    containing: [],
    kind: "",
    visible: true,
  };
  operator.annotate(category, 1, "");

  expect(operator.annotationState).toBe(AnnotationState.Annotated);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.width).toBe(100);
  expect(operator.height).toBe(100);

  expect(operator.points).toStrictEqual([
    { x: 0, y: 0 },
    { x: 100, y: 100 },
  ]);
  expect(operator.boundingBox).toStrictEqual([0, 0, 100, 100]);
  expect(operator.decodedMask).toBeDefined();
  expect(operator.annotation).toMatchObject({
    boundingBox: [0, 0, 100, 100],
    categoryId: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    activePlane: 1,
    imageId: "",
  });
});

test("deselect", async () => {
  const image = await Image.load(src);

  const operator = new RectangularAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 100, y: 100 });
  operator.onMouseUp({ x: 100, y: 100 });

  const category: Category = {
    color: "#0000FF",
    id: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    name: "foo",
    containing: [],
    kind: "",
    visible: true,
  };
  operator.annotate(category, 1, "");
  operator.deselect();

  expect(operator.annotationState).toBe(AnnotationState.Blank);

  expect(operator.origin).toStrictEqual(undefined);

  expect(operator.width).toBe(undefined);
  expect(operator.height).toBe(undefined);
});
