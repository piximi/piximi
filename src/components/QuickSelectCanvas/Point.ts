export default class Point {
  x: number = 0;
  y: number = 0;

  constructor(x?: number, y?: number) {
    if (x) this.x = x;
    if (y) this.y = y;
  }

  update(point: Point) {
    this.x = point.x;
    this.y = point.y;
  }

  getDifferenceTo(point: Point): Point {
    return new Point(this.x - point.x, this.y - point.y);
  }

  getDistanceTo(point: Point): number {
    const diff = this.getDifferenceTo(point);

    return Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2));
  }
}
