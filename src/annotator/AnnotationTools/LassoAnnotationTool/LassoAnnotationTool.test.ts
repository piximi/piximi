import { test } from "@jest/globals";
import { Image } from "image-js";
import { AnnotationStateType, Category } from "types";
import { data } from "../testData.json";
import { LassoAnnotationTool } from "./LassoAnnotationTool";

const src = data.image;

test("onMouseDown", async () => {
  const image = await Image.load(src);

  const operator = new LassoAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);

  expect(operator.anchor).toStrictEqual(undefined);
  expect(operator.buffer).toStrictEqual([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.points).toStrictEqual([]);
});

test("onMouseMove", async () => {
  const image = await Image.load(src);

  const operator = new LassoAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  for (let i = 1; i <= 5; i++) {
    operator.onMouseMove({ x: i, y: i });
  }

  expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

  expect(operator.annotation).toBe(undefined);

  expect(operator.anchor).toStrictEqual(undefined);
  expect(operator.buffer).toStrictEqual([
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
    { x: 4, y: 4 },
    { x: 5, y: 5 },
    { x: 0, y: 0 },
  ]);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.points).toStrictEqual([]);
});

test("onMouseUp", async () => {
  const image = await Image.load(src);

  const operator = new LassoAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  for (let i = 1; i <= 5; i++) {
    operator.onMouseMove({ x: i, y: i });
  }

  operator.onMouseUp({ x: 5, y: 5 });

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);

  expect(operator.annotation).toBe(undefined);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.anchor).toStrictEqual(undefined);
  expect(operator.points).toStrictEqual([
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
    { x: 4, y: 4 },
    { x: 5, y: 5 },
    { x: 0, y: 0 },
  ]);
  expect(operator.boundingBox).toStrictEqual([0, 0, 5, 5]);
  expect(operator.mask).toBeDefined();

  expect(operator.buffer).toStrictEqual([]);
});

test("select", async () => {
  const image = await Image.load(src);

  const operator = new LassoAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  for (let i = 1; i <= 5; i++) {
    operator.onMouseMove({ x: i, y: i });
  }

  operator.onMouseUp({ x: 5, y: 5 });

  const category: Category = {
    color: "#0000FF",
    id: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    name: "foo",
    visible: true,
  };

  operator.annotate(category, 1);

  expect(operator.annotationState).toBe(AnnotationStateType.Annotated);

  expect(operator.annotation).toMatchObject({
    boundingBox: [0, 0, 5, 5],
    categoryId: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    plane: 1,
  });

  expect(operator.boundingBox).toStrictEqual([0, 0, 5, 5]);
  expect(operator.mask).toBeDefined();

  expect(operator.anchor).toBe(undefined);
  expect(operator.buffer).toStrictEqual([]);
  expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
  expect(operator.points).toStrictEqual([
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
    { x: 4, y: 4 },
    { x: 5, y: 5 },
    { x: 0, y: 0 },
  ]);
});

test("deselect", async () => {
  const image = await Image.load(src);

  const operator = new LassoAnnotationTool(image);

  operator.onMouseDown({ x: 0, y: 0 });

  for (let i = 1; i <= 5; i++) {
    operator.onMouseMove({ x: i, y: i });
  }

  operator.onMouseUp({ x: 5, y: 5 });

  const category: Category = {
    color: "#0000FF",
    id: "5ed3511d-1223-4bba-a0c2-2b3897232d98",
    name: "foo",
    visible: true,
  };

  operator.annotate(category, 1);
  operator.deselect();

  expect(operator.annotationState).toBe(AnnotationStateType.Blank);

  expect(operator.annotation).toBe(undefined);

  expect(operator.boundingBox).toStrictEqual([0, 0, 5, 5]);
  expect(operator.mask).toBeDefined();

  expect(operator.anchor).toBe(undefined);
  expect(operator.buffer).toStrictEqual([]);
  expect(operator.origin).toBe(undefined);
  expect(operator.points).toStrictEqual([]);
});

test("makeCircle", async () => {
  const image = await Image.load(src);

  const operator = new LassoAnnotationTool(image);

  const origin = 50;
  const radius = 25;
  const marks = 50;
  operator.onMouseDown({ x: origin + radius, y: origin });

  for (let i = 0; i <= marks; i++) {
    operator.onMouseMove({
      x: origin + radius * Math.cos((2 * Math.PI * i) / marks),
      y: origin + radius * Math.sin((2 * Math.PI * i) / marks),
    });
  }
  operator.onMouseMove({ x: origin + radius, y: origin });
  operator.onMouseUp({ x: origin + radius, y: origin });
});

// test("makeJ", async () => {
//   const image = await Image.load(src);

//   const operator = new LassoAnnotationTool(image);

//   const route = [
//     [136.35368421052632, 73.83578947368422],
//     [136.35368421052632, 74.91368421052631],
//     [136.35368421052632, 76.53052631578947],
//     [136.35368421052632, 77.60842105263158],
//     [136.89263157894737, 80.30315789473684],
//     [137.97052631578947, 84.07578947368421],
//     [138.50947368421052, 86.77052631578947],
//     [139.58736842105264, 90.54315789473684],
//     [141.2042105263158, 95.39368421052632],
//     [142.82105263157894, 99.16631578947369],
//     [143.89894736842106, 102.4],
//     [145.5157894736842, 106.17263157894737],
//     [148.21052631578948, 109.94526315789474],
//     [150.36631578947367, 113.17894736842105],
//     [151.98315789473685, 115.33473684210526],
//     [154.13894736842104, 117.49052631578947],
//     [156.83368421052631, 119.64631578947369],
//     [158.98947368421054, 120.72421052631579],
//     [160.60631578947368, 121.26315789473684],
//     [161.68421052631578, 121.8021052631579],
//     [163.84, 122.34105263157895],
//     [164.9178947368421, 121.8021052631579],
//     [166.53473684210527, 121.8021052631579],
//     [168.15157894736842, 121.26315789473684],
//     [169.76842105263157, 119.64631578947369],
//     [171.9242105263158, 118.02947368421053],
//     [173.0021052631579, 116.95157894736842],
//     [174.61894736842106, 115.33473684210526],
//     [176.77473684210526, 112.64],
//     [178.39157894736843, 109.94526315789474],
//     [179.46947368421053, 108.32842105263158],
//     [180.54736842105262, 106.71157894736842],
//     [180.54736842105262, 105.09473684210526],
//     [181.08631578947367, 103.4778947368421],
//     [181.08631578947367, 102.4],
//     [181.08631578947367, 101.3221052631579],
//     [136.35368421052632, 73.83578947368422],
//   ];

//   const jCon = [
//     [136, 74],
//     [136, 75],
//     [136, 76],
//     [136, 77],
//     [136, 78],
//     [137, 79],
//     [137, 80],
//     [137, 81],
//     [138, 82],
//     [138, 83],
//     [138, 84],
//     [138, 85],
//     [139, 86],
//     [139, 87],
//     [139, 88],
//     [140, 89],
//     [140, 90],
//     [140, 91],
//     [140, 92],
//     [141, 93],
//     [141, 94],
//     [141, 95],
//     [142, 96],
//     [142, 97],
//     [143, 98],
//     [143, 99],
//     [143, 100],
//     [144, 101],
//     [144, 102],
//     [145, 103],
//     [145, 104],
//     [146, 105],
//     [146, 106],
//     [147, 107],
//     [147, 108],
//     [148, 109],
//     [148, 110],
//     [149, 111],
//     [149, 112],
//     [150, 113],
//     [151, 114],
//     [152, 115],
//     [153, 116],
//     [154, 117],
//     [155, 118],
//     [156, 119],
//     [157, 120],
//     [158, 121],
//     [159, 121],
//     [160, 121],
//     [161, 121],
//     [162, 122],
//     [163, 122],
//     [164, 122],
//     [165, 122],
//     [166, 122],
//     [167, 122],
//     [168, 121],
//     [169, 121],
//     [170, 120],
//     [171, 119],
//     [172, 118],
//     [173, 117],
//     [174, 116],
//     [175, 115],
//     [176, 114],
//     [177, 113],
//     [177, 112],
//     [178, 111],
//     [178, 110],
//     [179, 109],
//     [179, 108],
//     [180, 108],
//     [181, 107],
//     [181, 106],
//     [181, 105],
//     [181, 104],
//     [181, 103],
//     [181, 102],
//     [181, 101],
//     [180, 100],
//     [179, 100],
//     [178, 99],
//     [177, 99],
//     [176, 98],
//     [175, 97],
//     [174, 97],
//     [173, 96],
//     [172, 96],
//     [171, 95],
//     [170, 94],
//     [169, 94],
//     [168, 93],
//     [167, 93],
//     [166, 92],
//     [165, 91],
//     [164, 91],
//     [163, 90],
//     [162, 90],
//     [161, 89],
//     [160, 88],
//     [159, 88],
//     [158, 87],
//     [157, 87],
//     [156, 86],
//     [155, 85],
//     [154, 85],
//     [153, 84],
//     [152, 84],
//     [151, 83],
//     [150, 82],
//     [149, 82],
//     [148, 81],
//     [147, 81],
//     [146, 80],
//     [145, 79],
//     [144, 79],
//     [143, 78],
//     [142, 78],
//     [141, 77],
//     [140, 76],
//     [139, 76],
//     [138, 75],
//     [137, 75],
//   ];
//   operator.onMouseDown({ x: route[0][0], y: route[0][1] });

//   for (let i = 1; i < route.length; i++) {
//     operator.onMouseMove({ x: route[i][0], y: route[i][1] });
//   }
//   operator.onMouseUp({
//     x: route.at(-1).x,
//     y: route.at(-1).y,
//   });
// });

// test("onMouseUp (unconnected, without anchor)", async () => {
//   const image = await Image.load(src);

//   const operator = new LassoAnnotationTool(image);

//   operator.annotationState = AnnotationStateType.Annotating;

//   operator.onMouseDown({ x: 0, y: 0 });

//   for (let i = 1; i <= 5; i++) {
//     operator.onMouseMove({ x: i, y: i });
//   }

//   operator.onMouseUp({ x: 5, y: 5 });

//   expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

//   expect(operator.annotation).toBe(undefined);

//   expect(operator.anchor).toStrictEqual({ x: 5, y: 5 });
//   expect(operator.buffer).toStrictEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([]);
// });

// test("onMouseMove (with anchor)", async () => {
//   console.log("\n\n~~~~ON MOUSE MOVE WITH ANCHOR~~~~\n\n");
//   const image = await Image.load(src);

//   const operator = new LassoAnnotationTool(image);

//   operator.annotationState = AnnotationStateType.Annotating;

//   operator.onMouseDown({ x: 0, y: 0 });
//   operator.onMouseUp({ x: 0, y: 0 });

//   for (let i = 1; i <= 5; i++) {
//     operator.onMouseMove({ x: i, y: i });
//     operator.onMouseMove({ x: 0, y: 0 });
//   }

//   expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

//   expect(operator.annotation).toBe(undefined);

//   expect(operator.anchor).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.buffer).toStrictEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([]);
// });

// test("onMouseDown (subsequent, unconnected)", async() => {
//   const image = await Image.load(src);

//   const operator = new LassoAnnotationTool(image);

//   operator.origin = { x: 0, y: 0 };

//   operator.onMouseDown({ x: 100, y: 0 });

//   expect(operator.annotationState).toBe(AnnotationStateType.Annotating);

//   expect(operator.annotation).toBe(undefined);

//   expect(operator.anchor).toStrictEqual(undefined);
//   expect(operator.buffer).toStrictEqual([]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([]);
// });

// test("onMouseDown (subsequent, connected)", async () => {
//   const image = await Image.load(src);

//   const operator = new LassoAnnotationTool(image);

//   operator.anchor = { x: 0, y: 100 };
//   operator.buffer = [0, 0, 100, 0, 100, 100, 0, 100];
//   operator.origin = { x: 0, y: 0 };

//   operator.onMouseDown({ x: 1, y: 1 });

//   expect(operator.annotationState).toBe(AnnotationStateType.Annotated);

//   expect(operator.annotation).toBe(undefined);

//   expect(operator.anchor).toStrictEqual(undefined);
//   expect(operator.buffer).toStrictEqual([0, 0, 100, 0, 100, 100, 0, 100, 0, 0]);
//   expect(operator.origin).toStrictEqual(undefined);
//   expect(operator.points).toStrictEqual([0, 0, 100, 0, 100, 100, 0, 100, 0, 0]);
// });

// test("onMouseUp (unconnected, with anchor)", async () => {
//   const image = await Image.load(src);

//   const operator = new LassoAnnotationTool(image);

//   operator.annotating = true;

//   operator.anchor = { x: 100, y: 0 };
//   operator.buffer = [0, 0, 100, 0, 100, 100];
//   operator.origin = { x: 0, y: 0 };

//   operator.onMouseUp({ x: 0, y: 100 });

//   expect(operator.annotationState).toBe(false);
//   expect(operator.annotating).toBe(true);

//   expect(operator.annotation).toBe(undefined);

//   expect(operator.anchor).toStrictEqual({ x: 0, y: 100 });
//   expect(operator.buffer).toStrictEqual([0, 0, 100, 0, 0, 100]);
//   expect(operator.origin).toStrictEqual({ x: 0, y: 0 });
//   expect(operator.points).toStrictEqual([]);
// });
