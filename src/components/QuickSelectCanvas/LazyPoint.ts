import Point from "./Point";

export default class LazyPoint extends Point {
  moveByAngle(angle: number, distance: number) {
    const rotation = angle + Math.PI / 2;

    this.x = this.x + Math.sin(rotation) * distance;
    this.y = this.y - Math.cos(rotation) * distance;
  }

  equalsTo(point: Point): boolean {
    return this.x === point.x && this.y === point.y;
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
