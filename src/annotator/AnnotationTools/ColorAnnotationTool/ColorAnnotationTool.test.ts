import { test } from "@jest/globals";
import { Image } from "image-js";
import { data } from "../testData.json";
import { ColorAnnotationTool } from "./ColorAnnotationTool";
import { AnnotationStateType } from "types";

test("deselect", () => {
  expect(true).toBe(true);
});

test("onMouseDown", async () => {
  const src = data.image;

  const image = await Image.load(src);

  const operator = new ColorAnnotationTool(image); //, {width : 1000, height: 1000 * (image.height / image.width)});

  operator.onMouseDown({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);

  expect(operator.tolerance).toBe(1);

  expect(operator.toleranceMap).toBeDefined();

  expect(operator.overlayData.length).toBeGreaterThan(0);
});

test("onMouseMove", async () => {
  const src = data.image;

  const image = await Image.load(src);

  const operator = new ColorAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 20, y: 0 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);

  expect(operator.tolerance).toBe(20);
});

test("onMouseUp", async () => {
  const src = data.image;

  const image = await Image.load(src);

  const operator = new ColorAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 20, y: 0 });

  operator.onMouseUp({ x: 20, y: 0 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);

  //expect(operator.Operator).toBe(undefined);
});
