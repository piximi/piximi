export class Point {
  x: number;
  y: number;

  constructor(coordinates: { x: number; y: number }) {
    this.x = coordinates.x;
    this.y = coordinates.y;
  }

  equalsTo(that: Point): boolean {
    return this.x === that.x && this.y === that.y;
  }

  getAngleTo(point: Point): number {
    const { x, y } = this.getDifference(point);

    return Math.atan2(y, x);
  }

  getDifference(that: Point): Point {
    return new Point({ x: this.x - that.x, y: this.y - that.y });
  }

  getDistance(that: Point): number {
    const { x, y } = this.getDifference(that);

    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  }

  moveByAngle(angle: number, distance: number) {
    const rotation = angle + Math.PI / 2;

    this.x = this.x + Math.sin(rotation) * distance;
    this.y = this.y - Math.cos(rotation) * distance;
  }

  toObject(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  update(coordinates: { x: number; y: number }) {
    this.x = coordinates.x;
    this.y = coordinates.y;
  }
}

export const midpoint = (a: Point, b: Point) => {
  return { x: a.x + (b.x - a.x) / 2, y: a.y + (b.y - a.y) / 2 };
};
