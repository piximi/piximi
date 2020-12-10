import Point from "./Point";

export default class LazyPoint extends Point {
  update(point: Point) {
    this.x = point.x;
    this.y = point.y;
  }

  moveByAngle(angle: number, distance: number) {
    const rotation = angle + Math.PI / 2;

    this.x = this.x + Math.sin(rotation) * distance;
    this.y = this.y - Math.cos(rotation) * distance;
  }

  equalsTo(point: Point): boolean {
    return this.x === point.x && this.y === point.y;
  }

  getDifferenceTo(point: Point): Point {
    return new Point(this.x - point.x, this.y - point.y);
  }

  getDistanceTo(point: Point): number {
    const diff = this.getDifferenceTo(point);

    return Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2));
  }

  getAngleTo(point: Point): number {
    const diff = this.getDifferenceTo(point);

    return Math.atan2(diff.y, diff.x);
  }

  toObject() {
    return {
      x: this.x,
      y: this.y,
    };
  }
}
