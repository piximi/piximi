import { test } from "@jest/globals";
import { Image } from "image-js";
import { MagneticAnnotationTool } from "./MagneticAnnotationTool";
import { AnnotationStateType } from "types";
import { data } from "data/test-data/annotatorToolsTestData.json";
import { NewCategory } from "types/Category";

const src = data.image;

test("onMouseDown (unconnected)", async () => {
  const image = await Image.load(src);

  const operator = new MagneticAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);
  expect(operator.buffer).toStrictEqual([]);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.points).toStrictEqual([]);
});

test("onMouseMove (from origin)", async () => {
  const image = await Image.load(src);

  const operator = new MagneticAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 300, y: 300 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.buffer[0]).toStrictEqual({ x: 0, y: 0 });
  expect(operator.buffer.at(-1)!).toStrictEqual({
    x: 300,
    y: 300,
  });

  expect(operator.points).toStrictEqual([]);
});

test("onMouseMove (from anchor)", async () => {
  const image = await Image.load(src);

  const operator = new MagneticAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 150, y: 150 });

  operator.onMouseUp({ x: 150, y: 150 });

  operator.onMouseMove({ x: 300, y: 300 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.anchor).toStrictEqual({ x: 150, y: 150 });

  const anchorStart = operator.previous.length;

  expect(operator.buffer[0]).toStrictEqual({ x: 0, y: 0 });
  expect(operator.buffer[anchorStart]).toStrictEqual({ x: 150, y: 150 });
  expect(operator.buffer.at(-1)!).toStrictEqual({
    x: 300,
    y: 300,
  });

  expect(operator.points).toStrictEqual([]);
});

test("onMouseup (unconnected, from origin)", async () => {
  const image = await Image.load(src);

  const operator = new MagneticAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 150, y: 150 });

  operator.onMouseUp({ x: 150, y: 150 });

  operator.onMouseMove({ x: 300, y: 300 });

  operator.onMouseDown({ x: 300, y: 300 });

  operator.onMouseUp({ x: 300, y: 300 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.buffer[0]).toStrictEqual({ x: 0, y: 0 });
  expect(operator.path[0]).toStrictEqual({ x: 150, y: 150 });
  expect(operator.buffer.at(-1)!).toStrictEqual({
    x: 300,
    y: 300,
  });

  expect(operator.anchor).toStrictEqual({ x: 300, y: 300 });

  expect(operator.points).toStrictEqual([]);
});

test("onMouseup (unconnected, from anchor)", async () => {
  const image = await Image.load(src);

  const operator = new MagneticAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  operator.onMouseMove({ x: 300, y: 300 });

  operator.onMouseUp({ x: 300, y: 300 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(operator.anchor).toStrictEqual({ x: 300, y: 300 });
  expect(operator.buffer[0]).toStrictEqual({ x: 0, y: 0 });
  expect(operator.buffer.at(-1)!).toStrictEqual({
    x: 300,
    y: 300,
  });

  expect(operator.points).toStrictEqual([]);
});

test("onMouseUp (connected)", async () => {
  const image = await Image.load(src);

  const operator = new MagneticAnnotationTool(image);

  operator.onMouseDown({ x: 300, y: 0 });
  operator.onMouseUp({ x: 300, y: 0 });

  operator.onMouseMove({ x: 150, y: 300 });
  operator.onMouseDown({ x: 150, y: 300 });
  operator.onMouseUp({ x: 150, y: 300 });

  operator.onMouseMove({ x: 450, y: 300 });
  operator.onMouseDown({ x: 450, y: 300 });
  operator.onMouseUp({ x: 450, y: 300 });

  operator.onMouseMove({ x: 300, y: 0 });
  operator.onMouseDown({ x: 300, y: 0 });
  operator.onMouseUp({ x: 300, y: 0 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);

  expect(operator.annotation).toBe(undefined);
  expect(operator.points[0]).toStrictEqual({ x: 300, y: 0 });
  expect(operator.points.at(-1)!).toStrictEqual({
    x: 300,
    y: 0,
  });
  expect(operator.buffer).toStrictEqual([]);
  expect(operator.origin).toStrictEqual({ x: 300, y: 0 });
  expect(operator.decodedMask).toBeDefined();
});

test("select", async () => {
  const image = await Image.load(src);

  const operator = new MagneticAnnotationTool(image);

  operator.onMouseDown({ x: 300, y: 0 });
  operator.onMouseUp({ x: 300, y: 0 });

  operator.onMouseMove({ x: 150, y: 300 });
  operator.onMouseDown({ x: 150, y: 300 });
  operator.onMouseUp({ x: 150, y: 300 });

  operator.onMouseMove({ x: 450, y: 300 });
  operator.onMouseDown({ x: 450, y: 300 });
  operator.onMouseUp({ x: 450, y: 300 });

  operator.onMouseMove({ x: 300, y: 0 });
  operator.onMouseDown({ x: 300, y: 0 });
  operator.onMouseUp({ x: 300, y: 0 });

  const category: NewCategory = {
    color: "#0000FF",
    id: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    name: "foo",
    containing: [],
    kind: "",
    visible: true,
  };
  operator.annotate(category, 1, "");

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);
  expect(operator.boundingBox).toStrictEqual([2, 0, 300, 324]);
  expect(operator.decodedMask).toBeDefined();

  expect(operator.annotation).toMatchObject({
    boundingBox: [2, 0, 300, 324],
    categoryId: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    activePlane: 1,
    imageId: "",
  });
});

test("deselect", async () => {
  const image = await Image.load(src);

  const operator = new MagneticAnnotationTool(image);

  operator.onMouseDown({ x: 300, y: 0 });
  operator.onMouseUp({ x: 300, y: 0 });

  operator.onMouseMove({ x: 150, y: 300 });
  operator.onMouseDown({ x: 150, y: 300 });
  operator.onMouseUp({ x: 150, y: 300 });

  operator.onMouseMove({ x: 450, y: 300 });
  operator.onMouseDown({ x: 450, y: 300 });
  operator.onMouseUp({ x: 450, y: 300 });

  operator.onMouseMove({ x: 300, y: 0 });
  operator.onMouseDown({ x: 300, y: 0 });
  operator.onMouseUp({ x: 300, y: 0 });

  const category: NewCategory = {
    color: "#0000FF",
    id: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    name: "foo",
    containing: [],
    kind: "",
    visible: true,
  };
  operator.annotate(category, 1, "");

  operator.deselect();

  expect(operator.annotation).toBe(undefined);
  expect(operator.anchor).toStrictEqual(undefined);
  expect(operator.buffer).toStrictEqual([]);
  expect(operator.graph).toStrictEqual(undefined);
  expect(operator.origin).toStrictEqual(undefined);
  expect(operator.points).toStrictEqual([]);
  expect(operator.previous).toStrictEqual([]);

  expect(operator.annotationState).toBe(AnnotationStateType.Blank);
});
