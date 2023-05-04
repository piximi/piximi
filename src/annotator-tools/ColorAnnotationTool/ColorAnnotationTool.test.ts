import { test } from "@jest/globals";
import { Image } from "image-js";

import { ColorAnnotationTool } from "./ColorAnnotationTool";
import { AnnotationStateType, Category } from "types";

import { data } from "data/test-data/annotatorToolsTestData.json";

describe("onMouseDown", () => {
  const src = data.image;

  it("sets the origin", async () => {
    const image = await Image.load(src);
    const operator = new ColorAnnotationTool(image);

    operator.onMouseDown({ x: 0, y: 0 });

    expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

    expect(operator.roiManager).toBeDefined();

    expect(operator.toleranceQueue.length).toBeGreaterThan(0);
    expect(operator.seen.size).toBeGreaterThan(0);
    expect(operator.overlayData.length).toBeGreaterThan(0);

    expect(operator.annotationState).toBe(AnnotationStateType.Annotating);
  });
  it("sets the tool tip position", async () => {
    const image = await Image.load(src);
    const operator = new ColorAnnotationTool(image);

    operator.onMouseDown({ x: 0, y: 0 });

    expect(operator.toolTipPosition).toStrictEqual({ x: 0, y: 0 });
  });
  it("creates a tolerance map", async () => {
    const image = await Image.load(src);
    const operator = new ColorAnnotationTool(image);

    operator.onMouseDown({ x: 0, y: 0 });

    expect(operator.toleranceMap).toBeDefined();
  });
  it("creates a flood map", async () => {
    const image = await Image.load(src);
    const operator = new ColorAnnotationTool(image);

    operator.onMouseDown({ x: 0, y: 0 });

    expect(operator.floodMap).toBeDefined();
  });
  it("initializes a tolerance Queue", async () => {
    const image = await Image.load(src);
    const operator = new ColorAnnotationTool(image);
    operator.onMouseDown({ x: 0, y: 0 });
    expect(operator.toleranceQueue.length).toBe(8);
  });
  it("initializes the seen array", async () => {
    const image = await Image.load(src);
    const operator = new ColorAnnotationTool(image);

    operator.onMouseDown({ x: 0, y: 0 });

    expect(operator.seen.size).toBe(18);
  });
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

  expect(operator.roiManager).toBeDefined();
  expect(operator.roiMask).toBeDefined();
  expect(operator.boundingBox).toStrictEqual([0, 0, 107, 52]);
  expect(operator.maskData).toBeDefined();
});

test("select", async () => {
  const src = data.image;
  const image = await Image.load(src);

  const operator = new ColorAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 20, y: 0 });

  operator.onMouseUp({ x: 20, y: 0 });

  const category: Category = {
    color: "#0000FF",
    id: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    name: "foo",
    visible: true,
  };
  operator.annotate(category, 1, "");

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);
  expect(operator.boundingBox).toStrictEqual([0, 0, 107, 52]);

  expect(operator.annotation).toMatchObject({
    boundingBox: [0, 0, 107, 52],
    categoryId: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    plane: 1,
    imageId: "",
  });
});

test("deselect", async () => {
  const src = data.image;
  const image = await Image.load(src);

  const operator = new ColorAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 20, y: 0 });

  operator.onMouseUp({ x: 20, y: 0 });

  const category: Category = {
    color: "#0000FF",
    id: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    name: "foo",
    visible: true,
  };

  operator.annotate(category, 1, "");
  operator.deselect();

  expect(operator.overlayData).toBe("");

  expect(operator.roiManager).toBe(undefined);
  expect(operator.roiMask).toBe(undefined);

  expect(operator.points).toStrictEqual([]);

  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.toolTipPosition).toBe(undefined);

  expect(operator.tolerance).toBe(1);
  expect(operator.toleranceMap).toBe(undefined);
  expect(operator.toleranceQueue.length).toBe(0);
  expect(operator.seen.size).toBe(0);

  expect(operator.annotationState).toBe(AnnotationStateType.Blank);
});
