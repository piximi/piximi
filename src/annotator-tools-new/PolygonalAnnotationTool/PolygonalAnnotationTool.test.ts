import { test } from "@jest/globals";
import { Image } from "image-js";
import { PolygonalAnnotationTool } from "./PolygonalAnnotationTool";
import { AnnotationStateType } from "types";
import { data } from "data/test-data/annotatorToolsTestData.json";
import { NewCategory } from "types/Category";

const src = data.image;

test("onMouseDown", async () => {
  const image = await Image.load(src);

  const operator = new PolygonalAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);

  expect(operator.anchor).toStrictEqual(undefined);
  expect(operator.buffer).toStrictEqual([{ x: 0, y: 0 }]);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.points).toStrictEqual([]);
});
test("onMouseMove  (origin)", async () => {
  const image = await Image.load(src);

  const operator = new PolygonalAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 200, y: 200 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.anchor).toBe(undefined);
  expect(operator.buffer).toStrictEqual([
    { x: 0, y: 0 },
    { x: 200, y: 200 },
  ]);
});

test("onMouseUp (unconnected)", async () => {
  const image = await Image.load(src);

  const operator = new PolygonalAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseMove({ x: 200, y: 200 });
  operator.onMouseUp({ x: 200, y: 200 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);
});

test("onMouseMove (with anchor)", async () => {
  const image = await Image.load(src);

  const operator = new PolygonalAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });
  operator.onMouseUp({ x: 0, y: 0 });
  operator.onMouseMove({ x: 100, y: 0 });
  operator.onMouseDown({ x: 100, y: 0 });
  operator.onMouseUp({ x: 100, y: 0 });
  operator.onMouseMove({ x: 200, y: 200 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);

  expect(operator.buffer).toStrictEqual([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 200, y: 200 },
  ]);
});

test("onMouseUp (connected)", async () => {
  const image = await Image.load(src);

  const operator = new PolygonalAnnotationTool(image);

  operator.onMouseDown({ x: 100, y: 0 });
  operator.onMouseUp({ x: 100, y: 0 });

  operator.onMouseMove({ x: 0, y: 100 });
  operator.onMouseDown({ x: 0, y: 100 });
  operator.onMouseUp({ x: 0, y: 100 });

  operator.onMouseMove({ x: 200, y: 100 });
  operator.onMouseDown({ x: 200, y: 100 });
  operator.onMouseUp({ x: 200, y: 100 });

  operator.onMouseMove({ x: 100, y: 0 });
  operator.onMouseDown({ x: 100, y: 0 });
  operator.onMouseUp({ x: 100, y: 0 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);

  expect(operator.annotation).toBe(undefined);
  expect(operator.points).toStrictEqual([
    { x: 100, y: 0 },
    { x: 0, y: 100 },
    { x: 200, y: 100 },
    { x: 100, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 0 },
  ]);

  expect(operator.decodedMask).toBeDefined();
  expect(operator.buffer).toStrictEqual([]);
  expect(operator.origin).toBe(undefined);
  expect(operator.anchor).toBe(undefined);
});

test("select", async () => {
  const image = await Image.load(src);

  const operator = new PolygonalAnnotationTool(image);

  operator.onMouseDown({ x: 100, y: 0 });
  operator.onMouseUp({ x: 100, y: 0 });

  operator.onMouseMove({ x: 0, y: 100 });
  operator.onMouseDown({ x: 0, y: 100 });
  operator.onMouseUp({ x: 0, y: 100 });

  operator.onMouseMove({ x: 200, y: 100 });
  operator.onMouseDown({ x: 200, y: 100 });
  operator.onMouseUp({ x: 200, y: 100 });

  operator.onMouseMove({ x: 100, y: 0 });
  operator.onMouseDown({ x: 100, y: 0 });
  operator.onMouseUp({ x: 100, y: 0 });

  const category: NewCategory = {
    color: "#0000FF",
    id: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    name: "foo",
    containing: [],
    kind: "",
    visible: true,
  };

  operator.annotate(category, 0, "");

  expect(operator.annotation).toMatchObject({
    boundingBox: [0, 0, 200, 100],
    categoryId: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    activePlane: 0,
    imageId: "",
  });
});

test("deselect", async () => {
  const image = await Image.load(src);

  const operator = new PolygonalAnnotationTool(image);

  operator.onMouseDown({ x: 100, y: 0 });
  operator.onMouseUp({ x: 100, y: 0 });

  operator.onMouseMove({ x: 0, y: 100 });
  operator.onMouseDown({ x: 0, y: 100 });
  operator.onMouseUp({ x: 0, y: 100 });

  operator.onMouseMove({ x: 200, y: 100 });
  operator.onMouseDown({ x: 200, y: 100 });
  operator.onMouseUp({ x: 200, y: 100 });

  operator.onMouseMove({ x: 100, y: 0 });
  operator.onMouseDown({ x: 100, y: 0 });
  operator.onMouseUp({ x: 100, y: 0 });

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
  expect(operator.origin).toBe(undefined);
  expect(operator.anchor).toBe(undefined);
  expect(operator.buffer).toStrictEqual([]);
  expect(operator.points).toStrictEqual([]);
  expect(operator.annotationState).toBe(AnnotationStateType.Blank);
});
//
