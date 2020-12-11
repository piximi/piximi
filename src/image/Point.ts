export class Point {
  x: number;
  y: number;

  constructor({ x, y }: { x: number; y: number }) {
    this.x = x;
    this.y = y;
  }

  equalsTo(that: Point): boolean {
    return this.x === that.x && this.y === that.y;
  }

  getAngleTo(point: Point): number {
    const difference = this.getDifference(point);

    return Math.atan2(difference.y, difference.x);
  }

  getDifference(that: Point): Point {
    return new Point({ x: this.x - that.x, y: this.y - that.y });
  }

  getDistance(that: Point): number {
    const difference = this.getDifference(that);

    const a = Math.pow(difference.x, 2);
    const b = Math.pow(difference.y, 2);

    return Math.sqrt(a + b);
  }

  moveByAngle(angle: number, distance: number) {
    const rotation = angle + Math.PI / 2;

    this.x = this.x + Math.sin(rotation) * distance;
    this.y = this.y - Math.cos(rotation) * distance;
  }

  toObject(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  update(point: Point) {
    this.x = point.x;
    this.y = point.y;
  }
}
