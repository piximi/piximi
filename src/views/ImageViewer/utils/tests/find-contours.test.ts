import { test } from "@jest/globals";
import { padMask, findContours } from "views/ImageViewer/utils";
import { Point } from "../types";

const p = (y: number, x: number) => ({ y, x });

// the order of points matter
// they should specify the border of the polygon
// the direction (clockwise vs counter-clockwise) does not matter
// the starting point also does not matter
//
const expectRotationInvariantPoints = (actualPoints: Array<Point>) => {
  return {
    toStrictEqual: (expectedPoints: typeof actualPoints) => {
      const numExpected = expectedPoints.length;
      const numActual = actualPoints.length;

      const startingPointIdx = actualPoints.findIndex(
        (p) => p.y === expectedPoints[0].y && p.x === expectedPoints[0].x,
      );

      expect(startingPointIdx).toBeGreaterThanOrEqual(0);

      const nextPoint = actualPoints[(startingPointIdx + 1) % numExpected];
      const dir =
        nextPoint.x === expectedPoints[1 % numExpected].x &&
        nextPoint.y === expectedPoints[1 % numExpected].y
          ? 1
          : -1;

      for (let i = 0; i < numExpected; i++) {
        const actualPoint = actualPoints[(startingPointIdx + i) % numExpected];
        const expectedPoint =
          expectedPoints[(dir * i + numExpected) % numExpected];

        expect(actualPoint).toStrictEqual(expectedPoint);
      }

      // since we don't know the starting point,
      // we can't specify the closing point ahead of time in expected points,
      // instead check that starting and closing point match
      expect(actualPoints[0]).toStrictEqual(actualPoints[numActual - 1]);
    },
  };
};

test("single point", () => {
  const singlePoint = Uint8ClampedArray.from([1]);

  // prettier-ignore
  const paddedExpected = Int8Array.from([
    0, 0, 0,
    0, 1, 0,
    0, 0, 0
  ]);

  const expectedPoints: Array<Point> = [p(0, 0)];

  const unpaddedW = 1;
  const unpaddedH = 1;

  const paddedSinglePoint = padMask(singlePoint, unpaddedW, unpaddedH);

  expect(paddedSinglePoint.length).toBe(paddedExpected.length);
  expect(paddedSinglePoint).toStrictEqual(paddedExpected);

  const contours = findContours(
    paddedSinglePoint,
    unpaddedW + 2,
    unpaddedH + 2,
  );

  expect(contours.length).toBe(1);

  expect(contours[0].isHole).toBe(false);
  expect(contours[0].seqNum).toBe(2);
  expect(contours[0].parent).toBe(1);

  expectRotationInvariantPoints(contours[0].points).toStrictEqual(
    expectedPoints,
  );
});

test("find single contour of simple circle", () => {
  // prettier-ignore
  const simpleCircle = Uint8ClampedArray.from([
  //0  1  2  3  4  5  6
    0, 0, 0, 1, 0, 0, 0, // 0
    0, 0, 1, 1, 1, 0, 0, // 1
    0, 1, 1, 1, 1, 1, 0, // 2
    1, 1, 1, 1, 1, 1, 1, // 3
    0, 1, 1, 1, 1, 1, 0, // 4
    0, 0, 1, 1, 1, 0, 0, // 5
    0, 0, 0, 1, 0, 0, 0  // 6
  ]);

  // prettier-ignore
  const paddedExpected = Int8Array.from([
    // 0  1  2  3  4  5  6  7  8
       0, 0, 0, 0, 0, 0, 0, 0, 0, // 0
       0, 0, 0, 0, 1, 0, 0, 0, 0, // 1
       0, 0, 0, 1, 1, 1, 0, 0, 0, // 2
       0, 0, 1, 1, 1, 1, 1, 0, 0, // 3
       0, 1, 1, 1, 1, 1, 1, 1, 0, // 4
       0, 0, 1, 1, 1, 1, 1, 0, 0, // 5
       0, 0, 0, 1, 1, 1, 0, 0, 0, // 6
       0, 0, 0, 0, 1, 0, 0, 0, 0, // 7
       0, 0, 0, 0, 0, 0, 0, 0, 0  // 8
     ]);

  // prettier-ignore
  const expectedPoints: Array<Point> = [
    p(0, 3),
    p(1, 2), p(2, 1),
    p(3, 0),
    p(4, 1), p(5, 2),
    p(6, 3),
    p(5, 4), p(4, 5),
    p(3, 6),
    p(2, 5), p(1, 4)
  ];

  const unpaddedW = 7;
  const unpaddedH = 7;

  const paddedSimpleCircle = padMask(simpleCircle, unpaddedW, unpaddedH);

  expect(paddedSimpleCircle.length).toStrictEqual(paddedExpected.length);
  expect(paddedSimpleCircle).toStrictEqual(paddedExpected);

  const contours = findContours(
    paddedSimpleCircle,
    unpaddedW + 2,
    unpaddedH + 2,
  );

  expect(contours.length).toBe(1);

  expect(contours[0].isHole).toBe(false);
  expect(contours[0].seqNum).toBe(2);
  expect(contours[0].parent).toBe(1);

  expectRotationInvariantPoints(contours[0].points).toStrictEqual(
    expectedPoints,
  );
});

test("find both contours of donut", () => {
  // prettier-ignore
  const donut = Uint8ClampedArray.from([
  //0  1  2  3  4  5  6
    0, 0, 0, 1, 0, 0, 0, // 0
    0, 0, 1, 1, 1, 0, 0, // 1
    0, 1, 1, 0, 1, 1, 0, // 2
    1, 1, 0, 0, 0, 1, 1, // 3
    1, 0, 0, 0, 0, 0, 1, // 4
    1, 1, 0, 0, 0, 1, 1, // 5
    0, 1, 1, 0, 1, 1, 0, // 6
    0, 0, 1, 1, 1, 0, 0, // 7
    0, 0, 0, 1, 0, 0, 0  // 8
  ]);

  // prettier-ignore
  const paddedExpected = Int8Array.from([
  //0  1  2  3  4  5  6  7  8
    0, 0, 0, 0, 0, 0, 0, 0, 0, // 0
    0, 0, 0, 0, 1, 0, 0, 0, 0, // 1
    0, 0, 0, 1, 1, 1, 0, 0, 0, // 2
    0, 0, 1, 1, 0, 1, 1, 0, 0, // 3
    0, 1, 1, 0, 0, 0, 1, 1, 0, // 4
    0, 1, 0, 0, 0, 0, 0, 1, 0, // 5
    0, 1, 1, 0, 0, 0, 1, 1, 0, // 6
    0, 0, 1, 1, 0, 1, 1, 0, 0, // 7
    0, 0, 0, 1, 1, 1, 0, 0, 0, // 8
    0, 0, 0, 0, 1, 0, 0, 0, 0, // 9
    0, 0, 0, 0, 0, 0, 0, 0, 0  // 10
  ]);

  // prettier-ignore
  const expectedOuterBorderPoints: Array<Point> = [
    p(0, 3),
    p(1, 2), p(2, 1),
    p(3, 0), p(4, 0), p(5, 0),
    p(6, 1), p(7, 2),
    p(8, 3),
    p(7, 4), p(6, 5),
    p(5, 6), p(4, 6), p(3, 6),
    p(2, 5), p(1, 4)
  ];

  // prettier-ignore
  const exepectedHoleBorderPoints: Array<Point> = [
    p(1, 3),
    p(2, 2), p(3, 1),
    p(4, 0),
    p(5, 1), p(6, 2),
    p(7, 3),
    p(6, 4), p(5, 5),
    p(4, 6),
    p(3, 5), p(2, 4)
  ];

  const unpaddedW = 7;
  const unpaddedH = 9;

  const paddedDonut = padMask(donut, unpaddedW, unpaddedH);

  expect(paddedDonut.length).toBe(paddedExpected.length);
  expect(paddedDonut).toStrictEqual(paddedExpected);

  const contours = findContours(paddedDonut, unpaddedW + 2, unpaddedH + 2);

  expect(contours.length).toBe(2);

  expect(contours[0].isHole).toBe(false);
  expect(contours[0].seqNum).toBe(2);
  expect(contours[0].parent).toBe(1);

  expectRotationInvariantPoints(contours[0].points).toStrictEqual(
    expectedOuterBorderPoints,
  );

  expect(contours[1].isHole).toBe(true);
  expect(contours[1].seqNum).toBe(3);
  expect(contours[1].parent).toBe(2);

  expectRotationInvariantPoints(contours[1].points).toStrictEqual(
    exepectedHoleBorderPoints,
  );
});

test("find all contours in complex mask", () => {
  // equiv. to Fig 1. in (Suzuki, Abe; 1985)
  // prettier-ignore
  const complex = Uint8ClampedArray.from([
  //0  1  2  3  4  5  6  7  8  9
    0, 0, 0, 1, 1, 1, 1, 0, 0, 0, // 0
    0, 0, 1, 1, 1, 1, 1, 1, 0, 0, // 1
    0, 1, 1, 0, 0, 0, 0, 1, 1, 0, // 2
    1, 1, 0, 0, 1, 1, 0, 0, 1, 1, // 3
    1, 0, 0, 0, 1, 1, 0, 0, 0, 1, // 4
    1, 1, 0, 0, 0, 0, 0, 0, 1, 1, // 5
    0, 1, 1, 0, 0, 0, 0, 1, 1, 0, // 6
    0, 0, 1, 1, 1, 1, 1, 1, 0, 0, // 7
    0, 0, 0, 1, 1, 1, 1, 0, 0, 0, // 8
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 9
    0, 1, 1, 0, 0, 0, 0, 0, 0, 0, // 10
    0, 1, 1, 0, 0, 0, 0, 0, 0, 0, // 11
  ]);

  // prettier-ignore
  const paddedExpected = Int8Array.from([
    // 0  1  2  3  4  5  6  7  8  9  10 11
       0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0
       0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, // 1
       0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, // 2
       0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, // 3
       0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, // 4
       0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, // 5
       0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, // 6
       0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, // 7
       0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, // 8
       0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, // 9
       0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 10
       0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, // 11
       0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, // 12
       0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0  // 13
     ]);

  // prettier-ignore
  const expectedOuterMostBorderPoints: Array<Point> = [
    p(1, 2), p(2, 1),
    p(3, 0), p(4, 0), p(5, 0),
    p(6, 1), p(7, 2),
    p(8, 3), p(8, 4), p(8, 5), p(8, 6),
    p(7, 7), p(6, 8),
    p(5, 9), p(4, 9), p(3, 9),
    p(2, 8), p(1, 7),
    p(0, 6), p(0, 5), p(0, 4), p(0, 3)
  ];

  // prettier-ignore
  const expectedHoleBorderPoints: Array<Point> = [
    p(2, 2), p(3, 1),
    p(4, 0),
    p(5, 1), p(6, 2),
    p(7, 3), p(7, 4), p(7, 5), p(7, 6),
    p(6, 7), p(5, 8),
    p(4, 9),
    p(3, 8), p(2, 7),
    p(1, 6), p(1, 5), p(1, 4), p(1, 3)
  ];

  // prettier-ignore
  const expectedInnerIslandBorderPoints: Array<Point> = [
    p(3, 4), p(4, 4), p(4, 5), p(3, 5)
  ];

  // prettier-ignore
  const expectedOuterIslandBorderPoints: Array<Point> = [
    p(10, 1), p(11, 1), p(11, 2), p(10, 2)
  ];

  const unpaddedW = 10;
  const unpaddedH = 12;

  const paddedComplex = padMask(complex, unpaddedW, unpaddedH);

  expect(paddedComplex.length).toBe(paddedExpected.length);
  expect(paddedComplex).toStrictEqual(paddedExpected);

  const contours = findContours(paddedComplex, unpaddedW + 2, unpaddedH + 2);

  expect(contours.length).toBe(4);

  expect(contours[0].isHole).toBe(false);
  expect(contours[0].seqNum).toBe(2);
  expect(contours[0].parent).toBe(1);

  expectRotationInvariantPoints(contours[0].points).toStrictEqual(
    expectedOuterMostBorderPoints,
  );

  expect(contours[1].isHole).toBe(true);
  expect(contours[1].seqNum).toBe(3);
  expect(contours[1].parent).toBe(2);

  expectRotationInvariantPoints(contours[1].points).toStrictEqual(
    expectedHoleBorderPoints,
  );

  expect(contours[2].isHole).toBe(false);
  expect(contours[2].seqNum).toBe(4);
  expect(contours[2].parent).toBe(3);

  expectRotationInvariantPoints(contours[2].points).toStrictEqual(
    expectedInnerIslandBorderPoints,
  );

  expect(contours[3].isHole).toBe(false);
  expect(contours[3].seqNum).toBe(5);
  expect(contours[3].parent).toBe(1);

  expectRotationInvariantPoints(contours[3].points).toStrictEqual(
    expectedOuterIslandBorderPoints,
  );
});

/*
 * "donut preffered", refers to the test donut example in the above test,
 * with the (x,y) coordinate (6, 4) (in the unpadded array) having
 * a point with the outer border and inner hold border
 * has to be treated as a special case
 *
 * handled by the line, in `findContours`:
 * `rightExamined || B.isHole ? -NBD : NBD`
 *
 * This has two holes, with 1 pixel borders in common as well
 * and must also be treated as a special case, with the above line ammended to be
 * `rightExamined || -NBD : NBD`
 *
 * Either one of the two special cases (the donut or the skipped version
 * of this test below this one)
 * can be accounted for by the algorithm described in the Suzuki, Abe paper,
 * but not both
 *
 * If you're feeling clever, you may want to try and find a way to account for both of them
 * while still passing all other, regular cases, but I've decided to only handle
 * the Donut case, and treat the right hole in this test as area to fill in
 *
 * - Nodar
 */
test("find all contours in double border and single point island mask - donut preffered", () => {
  // equiv. to Fig 3. in (Suzuki, Abe; 1985)
  // prettier-ignore
  const complex = Uint8ClampedArray.from([
  //0  1  2  3  4  5  6  7  8
    1, 1, 1, 1, 1, 1, 1, 0, 0, // 0
    1, 0, 0, 1, 0, 0, 1, 0, 1, // 1
    1, 0, 0, 1, 0, 0, 1, 0, 0, // 2
    1, 1, 1, 1, 1, 1, 1, 0, 0  // 3
  ]);

  // prettier-ignore
  const paddedExpected = Int8Array.from([
  //0  1  2  3  4  5  6  7  8  9  10
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0
    0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, // 1
    0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, // 2
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, // 3
    0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, // 4
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0  // 5
  ]);

  // prettier-ignore
  const expectedOuterMostBorderPoints: Array<Point> = [
    p(1, 0), p(2, 0),
    p(3, 0), p(3, 1), p(3, 2),
    p(3, 3),
    p(3, 4), p(3, 5), p(3, 6),
    p(2, 6), p(1, 6),
    p(0, 6), p(0, 5), p(0, 4),
    p(0, 3),
    p(0, 2), p(0, 1), p(0, 0)
  ];

  // prettier-ignore
  const expectedLeftHoleBorderPoints: Array<Point> = [
    p(1, 0), p(2, 0),
    p(3, 1), p(3, 2),
    p(2, 3), p(1, 3),
    p(0, 2), p(0, 1)
  ];

  const expectedIslandPoints: Array<Point> = [p(1, 8)];

  const unpaddedW = 9;
  const unpaddedH = 4;

  const paddedComplex = padMask(complex, unpaddedW, unpaddedH);

  expect(paddedComplex.length).toBe(paddedExpected.length);
  expect(paddedComplex).toStrictEqual(paddedExpected);

  const contours = findContours(paddedComplex, unpaddedW + 2, unpaddedH + 2);

  expect(contours.length).toBe(3);

  expect(contours[0].isHole).toBe(false);
  expect(contours[0].seqNum).toBe(2);
  expect(contours[0].parent).toBe(1);

  expectRotationInvariantPoints(contours[0].points).toStrictEqual(
    expectedOuterMostBorderPoints,
  );

  expect(contours[1].isHole).toBe(true);
  expect(contours[1].seqNum).toBe(3);
  expect(contours[1].parent).toBe(2);

  expectRotationInvariantPoints(contours[1].points).toStrictEqual(
    expectedLeftHoleBorderPoints,
  );

  expect(contours[2].isHole).toBe(false);
  expect(contours[2].seqNum).toBe(4);
  expect(contours[2].parent).toBe(1);

  expectRotationInvariantPoints(contours[2].points).toStrictEqual(
    expectedIslandPoints,
  );
});

test.skip("find all contours in double border and single point island mask - donut not preffered", () => {
  // equiv. to Fig 3. in (Suzuki, Abe; 1985)
  // prettier-ignore
  const complex = Uint8ClampedArray.from([
  //0  1  2  3  4  5  6  7  8
    1, 1, 1, 1, 1, 1, 1, 0, 0, // 0
    1, 0, 0, 1, 0, 0, 1, 0, 1, // 1
    1, 0, 0, 1, 0, 0, 1, 0, 0, // 2
    1, 1, 1, 1, 1, 1, 1, 0, 0  // 3
  ]);

  // prettier-ignore
  const paddedExpected = Int8Array.from([
  //0  1  2  3  4  5  6  7  8  9  10
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0
    0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, // 1
    0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, // 2
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, // 3
    0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, // 4
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0  // 5
  ]);

  // prettier-ignore
  const expectedOuterMostBorderPoints: Array<Point> = [
    p(1, 0), p(2, 0),
    p(3, 0), p(3, 1), p(3, 2),
    p(3, 3),
    p(3, 4), p(3, 5), p(3, 6),
    p(2, 6), p(1, 6),
    p(0, 6), p(0, 5), p(0, 4),
    p(0, 3),
    p(0, 2), p(0, 1), p(0, 0)
  ];

  // prettier-ignore
  const expectedLeftHoleBorderPoints: Array<Point> = [
    p(1, 0), p(2, 0),
    p(3, 1), p(3, 2),
    p(2, 3), p(1, 3),
    p(0, 2), p(0, 1)
  ];

  // prettier-ignore
  const expectedRightHoleBorderPoints: Array<Point> = [
    p(1, 3), p(2, 3),
    p(3, 4), p(3, 5),
    p(2, 6), p(1, 6),
    p(0, 5), p(0, 4)
  ];

  const expectedIslandPoints: Array<Point> = [p(1, 8)];

  const unpaddedW = 9;
  const unpaddedH = 4;

  const paddedComplex = padMask(complex, unpaddedW, unpaddedH);

  expect(paddedComplex.length).toBe(paddedExpected.length);
  expect(paddedComplex).toStrictEqual(paddedExpected);

  const contours = findContours(paddedComplex, unpaddedW + 2, unpaddedH + 2);

  expect(contours.length).toBe(4);

  expect(contours[0].isHole).toBe(false);
  expect(contours[0].seqNum).toBe(2);
  expect(contours[0].parent).toBe(1);

  expectRotationInvariantPoints(contours[0].points).toStrictEqual(
    expectedOuterMostBorderPoints,
  );

  expect(contours[1].isHole).toBe(true);
  expect(contours[1].seqNum).toBe(3);
  expect(contours[1].parent).toBe(2);

  expectRotationInvariantPoints(contours[1].points).toStrictEqual(
    expectedLeftHoleBorderPoints,
  );

  expect(contours[2].isHole).toBe(true);
  expect(contours[2].seqNum).toBe(4);
  expect(contours[2].parent).toBe(2);

  expectRotationInvariantPoints(contours[2].points).toStrictEqual(
    expectedRightHoleBorderPoints,
  );

  expect(contours[3].isHole).toBe(false);
  expect(contours[3].seqNum).toBe(5);
  expect(contours[3].parent).toBe(1);

  expectRotationInvariantPoints(contours[3].points).toStrictEqual(
    expectedIslandPoints,
  );
});
