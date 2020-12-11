import { Point } from "./Point";

const EPSILON = 1e-6;

export class CatenaryCurve {
  p1?: Point;
  p2?: Point;
  iterations: number;
  segments: number;

  constructor(
    { iterations, segments }: { iterations: number; segments: number } = {
      iterations: 100,
      segments: 50,
    }
  ) {
    this.iterations = iterations;

    this.segments = segments;
  }

  drawToCanvas(
    context: CanvasRenderingContext2D,
    point1: Point,
    point2: Point,
    chainLength: number
  ) {
    if (this.p1) {
      this.p1.update(point1);
    } else {
      return;
    }

    if (this.p2) {
      this.p2.update(point2);
    } else {
      return;
    }

    const isFlipped = this.p1.x > this.p2.x;

    const p1 = isFlipped ? this.p2 : this.p1;
    const p2 = isFlipped ? this.p1 : this.p2;

    const distance = p1.getDistance(p2);

    let curve = [];
    let isStraight = true;

    // Prevent "expensive" catenary calculations if it would only result
    // in a straight line.
    if (distance < chainLength) {
      const diff = p2.x - p1.x;

      // If the distance on the x axis of both points is too small, don't
      // calculate a catenary.
      if (diff > 0.01) {
        let h = p2.x - p1.x;
        let v = p2.y - p1.y;
        let a = -this.getCatenaryParameter(h, v, chainLength, this.iterations);
        let x = (a * Math.log((chainLength + v) / (chainLength - v)) - h) * 0.5;
        let y = a * Math.cosh(x / a);
        let offsetX = p1.x - x;
        let offsetY = p1.y - y;
        curve = this.getCurve(a, p1, p2, offsetX, offsetY, this.segments);
        isStraight = false;
      } else {
        let mx = (p1.x + p2.x) * 0.5;
        let my = (p1.y + p2.y + chainLength) * 0.5;

        curve = [
          [p1.x, p1.y],
          [mx, my],
          [p2.x, p2.y],
        ];
      }
    } else {
      curve = [
        [p1.x, p1.y],
        [p2.x, p2.y],
      ];
    }

    if (isStraight) {
      this.drawLine(curve, context);
    } else {
      this.drawCurve(curve, context);
    }

    return curve;
  }

  getCatenaryParameter(h: number, v: number, size: number, iterations: number) {
    let m = Math.sqrt(size * size - v * v) / h;
    let x = Math.acosh(m) + 1;
    let prevx = -1;
    let count = 0;

    while (Math.abs(x - prevx) > EPSILON && count < iterations) {
      prevx = x;
      x = x - (Math.sinh(x) - m * x) / (Math.cosh(x) - m);
      count++;
    }

    return h / (2 * x);
  }

  getCurve(
    p: number,
    a: Point,
    b: Point,
    offsetX: number,
    offsetY: number,
    segments: number
  ) {
    let data = [a.x, p * Math.cosh((a.x - offsetX) / p) + offsetY];

    const d = b.x - a.x;
    const length = segments - 1;

    for (let i = 0; i < length; i++) {
      let x = a.x + (d * (i + 0.5)) / length;
      let y = p * Math.cosh((x - offsetX) / p) + offsetY;
      data.push(x, y);
    }

    data.push(b.x, p * Math.cosh((b.x - offsetX) / p) + offsetY);

    return data;
  }

  drawLine(data: Array<any>, context: CanvasRenderingContext2D) {
    context.moveTo(data[0][0], data[0][1]);

    context.lineTo(data[1][0], data[1][1]);
  }

  drawCurve(data: Array<any>, context: CanvasRenderingContext2D) {
    let length = data.length * 0.5 - 1;
    let ox = data[2];
    let oy = data[3];

    let temp = [];

    context.moveTo(data[0], data[1]);

    for (let i = 2; i < length; i++) {
      let x = data[i * 2];
      let y = data[i * 2 + 1];
      let mx = (x + ox) * 0.5;
      let my = (y + oy) * 0.5;
      temp.push([ox, oy, mx, my]);
      context.quadraticCurveTo(ox, oy, mx, my);
      ox = x;
      oy = y;
    }

    length = data.length;

    context.quadraticCurveTo(
      data[length - 4],
      data[length - 3],
      data[length - 2],
      data[length - 1]
    );

    return temp;
  }
}
