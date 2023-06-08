import { test } from "@jest/globals";
import { Image } from "image-js";
import { QuickAnnotationTool } from "./QuickAnnotationTool";
import { AnnotationStateType, Category } from "types";
import { data } from "data/test-data/annotatorToolsTestData.json";

const src = data.image;

test("initializeSuperPixels", async () => {
  const image = await Image.load(src);

  const operator = new QuickAnnotationTool(image);

  operator.initializeSuperpixels(30);

  expect(operator.regionSize).toBe(30);

  expect(operator.superpixels).toBeDefined();
  expect(Object.keys(operator.superpixelsMap!).length).toBeGreaterThan(0);
});

test("onMouseMove", async () => {
  const image = await Image.load(src);

  const operator = new QuickAnnotationTool(image);
  operator.initializeSuperpixels(30);

  operator.onMouseMove({ x: 100, y: 100 });

  expect(operator.annotation).toBe(undefined);
  expect(operator.currentMask).toBeDefined();
});

test("onMouseDown", async () => {
  const image = await Image.load(src);

  const operator = new QuickAnnotationTool(image);
  operator.initializeSuperpixels(30);

  operator.onMouseMove({ x: 100, y: 100 });
  operator.onMouseDown({ x: 100, y: 100 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);
});

test("onMouseUp", async () => {
  const image = await Image.load(src);

  const operator = new QuickAnnotationTool(image);
  operator.initializeSuperpixels(30);

  operator.onMouseDown({ x: 100, y: 100 });

  operator.onMouseMove({ x: 200, y: 200 });

  operator.onMouseUp({ x: 200, y: 200 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);

  expect(operator.boundingBox).toStrictEqual([182, 175, 218, 212]);
  expect(operator.decodedMask).toBeDefined();
});

test("onMouseUp (Adding)", async () => {
  const image = await Image.load(src);

  const operator = new QuickAnnotationTool(image);
  operator.initializeSuperpixels(30);

  operator.onMouseDown({ x: 100, y: 100 });

  operator.onMouseMove({ x: 200, y: 200 });

  operator.onMouseUp({ x: 200, y: 200 });

  operator.onMouseMove({ x: 300, y: 200 });

  operator.onMouseDown({ x: 300, y: 200 });
  operator.onMouseMove({ x: 200, y: 200 });
  operator.onMouseUp({ x: 200, y: 200 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);

  expect(operator.boundingBox).toStrictEqual([182, 175, 218, 212]);
  expect(operator.decodedMask).toBeDefined();
});

test("select", async () => {
  const image = await Image.load(src);

  const operator = new QuickAnnotationTool(image);
  operator.initializeSuperpixels(30);

  operator.onMouseDown({ x: 100, y: 100 });

  operator.onMouseMove({ x: 200, y: 200 });

  operator.onMouseUp({ x: 200, y: 200 });

  operator.onMouseMove({ x: 300, y: 200 });

  operator.onMouseDown({ x: 300, y: 200 });
  operator.onMouseMove({ x: 200, y: 200 });
  operator.onMouseUp({ x: 200, y: 200 });

  const category: Category = {
    color: "#0000FF",
    id: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    name: "foo",
    visible: true,
  };
  operator.annotate(category, 1, "");

  expect(operator.annotation).toMatchObject({
    boundingBox: [182, 175, 218, 212],
    categoryId: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    plane: 1,
    imageId: "",
  });
});

test("deselect", async () => {
  const image = await Image.load(src);

  const operator = new QuickAnnotationTool(image);
  operator.initializeSuperpixels(30);

  operator.onMouseDown({ x: 100, y: 100 });

  operator.onMouseMove({ x: 200, y: 200 });

  operator.onMouseUp({ x: 200, y: 200 });

  operator.onMouseMove({ x: 300, y: 200 });

  operator.onMouseDown({ x: 300, y: 200 });
  operator.onMouseMove({ x: 200, y: 200 });
  operator.onMouseUp({ x: 200, y: 200 });

  const category: Category = {
    color: "#0000FF",
    id: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    name: "foo",
    visible: true,
  };
  operator.annotate(category, 1, "");

  operator.deselect();

  expect(operator.colorMasks).toBe(undefined);
  expect(operator.currentSuperpixels.size).toBe(0);
  expect(operator.lastSuperpixel).toBe(0);
  expect(operator.annotationState).toBe(AnnotationStateType.Blank);
});
