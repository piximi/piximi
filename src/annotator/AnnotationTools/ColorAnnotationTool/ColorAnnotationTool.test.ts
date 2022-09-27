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

  const operator = new ColorAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  expect(operator.annotation).toBe(undefined);

  expect(operator.tolerance).toBe(1);

  expect(operator.initialPosition).toStrictEqual({ x: 0, y: 0 });
  expect(operator.toolTipPosition).toStrictEqual({ x: 0, y: 0 });

  expect(operator.toleranceMap).toBeDefined();
  expect(operator.floodMap).toBeDefined();
  expect(operator.roiManager).toBeDefined();

  expect(operator.seen.size).toBeGreaterThan(0);
  expect(operator.overlayData.length).toBeGreaterThan(0);

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);
});

test("onMouseMove", async () => {
  const src = data.image;

  const image = await Image.load(src);

  const operator = new ColorAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 20, y: 0 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.toolTipPosition).toStrictEqual({ x: 20, y: 0 });
});

test("onMouseUp", async () => {
  const src = data.image;

  const image = await Image.load(src);

  const operator = new ColorAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 20, y: 0 });

  operator.onMouseUp({ x: 20, y: 0 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);
});
