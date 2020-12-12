import "jest";
import { Point } from "./Point";

test("equalsTo", () => {
  const a = new Point({ x: 16, y: 16 });
  const b = new Point({ x: 32, y: 32 });

  expect(a.equalsTo(a)).toBeTruthy();

  expect(a.equalsTo(b)).toBeFalsy();
});

test("getAngleTo", () => {
  const a = new Point({ x: 16, y: 16 });
  const b = new Point({ x: 32, y: 32 });

  expect(a.getAngleTo(b)).toBeCloseTo(-2.35619);
});

test("getDifference", () => {
  const a = new Point({ x: 16, y: 16 });
  const b = new Point({ x: 32, y: 32 });

  expect(a.getDifference(b).x).toBe(-16);
  expect(a.getDifference(b).y).toBe(-16);
});

test("getDistance", () => {
  const a = new Point({ x: 16, y: 16 });
  const b = new Point({ x: 32, y: 32 });

  expect(a.getDistance(b)).toBeCloseTo(22.62741);
});

test("moveByAngle", () => {
  const a = new Point({ x: 16, y: 16 });

  a.moveByAngle(180, 16);

  expect(a.toObject().x).toBeCloseTo(6.42463);
  expect(a.toObject().y).toBeCloseTo(3.18155);
});

test("toObject", () => {
  const a = new Point({ x: 16, y: 16 });
  const b = new Point({ x: 32, y: 32 });

  expect(a.getDistance(b)).toBeCloseTo(22.62741);
});

test("update", () => {
  const a = new Point({ x: 16, y: 16 });
  const b = new Point({ x: 32, y: 32 });

  expect(a.getDistance(b)).toBeCloseTo(22.62741);
});
