import { test } from "@jest/globals";
import { Image } from "image-js";

import { data } from "data/test-data/annotatorToolsTestData.json";
import { EllipticalAnnotationTool } from "../tools";
import { AnnotationState } from "../enums";
import { Category } from "store/data/types";

const src = data.image;

test("onMouseDown", async () => {
  const image = await Image.load(src);

  const operator = new EllipticalAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.annotation).toBe(undefined);

  expect(operator.center).toStrictEqual(undefined);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.radius).toStrictEqual(undefined);
});

test("onMouseMove", async () => {
  const image = await Image.load(src);

  const operator = new EllipticalAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationState.Annotating);

  expect(operator.annotation).toBe(undefined);

  expect(operator.center).toStrictEqual({ x: 50, y: 50 });
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.radius).toStrictEqual({ x: 50, y: 50 });
});

test("onMouseUp", async () => {
  const image = await Image.load(src);

  const operator = new EllipticalAnnotationTool(image);
  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });
  operator.onMouseUp({ x: 100, y: 100 });

  expect(operator.center).toStrictEqual({ x: 50, y: 50 });
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.radius).toStrictEqual({ x: 50, y: 50 });
  expect(operator.points).toBeDefined();
  expect(operator.points?.length).toBeGreaterThan(0);
  expect(operator.annotationState).toBe(AnnotationState.Annotated);

  expect(operator.annotation).toBe(undefined);
});

test("select", async () => {
  const image = await Image.load(src);

  const operator = new EllipticalAnnotationTool(image);

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
  expect(operator.boundingBox).toStrictEqual([0, 0, 100, 100]);

  expect(operator.annotation).toMatchObject({
    boundingBox: [0, 0, 100, 100],
    categoryId: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    activePlane: 1,
    imageId: "",
  });

  expect(operator.center).toStrictEqual({ x: 50, y: 50 });
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.radius).toStrictEqual({ x: 50, y: 50 });
});

test("deselect", async () => {
  const image = await Image.load(src);

  const operator = new EllipticalAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 100 });
  operator.onMouseUp({ x: 100, y: 100 });
  operator.deselect();

  expect(operator.annotationState).toBe(AnnotationState.Blank);

  expect(operator.annotation).toBe(undefined);

  expect(operator.center).toStrictEqual(undefined);
  expect(operator.origin).toStrictEqual(undefined);
  expect(operator.radius).toStrictEqual(undefined);
});
