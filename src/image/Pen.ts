import { Point } from "./Point";

const RADIUS_DEFAULT = 30;

export class Pen {
  angle: number;
  distance: number;
  enabled: boolean;
  moved: boolean;
  pointer: Point;
  radius: number;
  tip: Point;

  constructor({
    radius = RADIUS_DEFAULT,
    enabled = true,
    initialPoint = { x: 0, y: 0 },
  } = {}) {
    this.angle = 0;
    this.distance = 0;
    this.enabled = enabled;
    this.moved = false;
    this.pointer = new Point({ x: initialPoint.x, y: initialPoint.y });
    this.radius = radius;
    this.tip = new Point({ x: initialPoint.x, y: initialPoint.y });
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setRadius(radius: number) {
    this.radius = radius;
  }

  getRadius(): number {
    return this.radius;
  }

  getTipCoordinates(): { x: number; y: number } {
    return this.tip.toObject();
  }

  getPointerCoordinates(): { x: number; y: number } {
    return this.pointer.toObject();
  }

  getTip(): Point {
    return this.tip;
  }

  getPointer(): Point {
    return this.pointer;
  }

  getAngle(): number {
    return this.angle;
  }

  getDistance(): number {
    return this.distance;
  }

  brushHasMoved() {
    return this.moved;
  }

  update(point: Point, updateTip: boolean = false): boolean {
    this.moved = false;

    if (this.pointer.equalsTo(point) && !updateTip) {
      return false;
    }

    this.pointer.update(point);

    if (updateTip) {
      this.moved = true;

      this.tip.update(point);

      return true;
    }

    if (this.enabled) {
      this.distance = this.pointer.getDistance(this.tip);

      this.angle = this.pointer.getAngleTo(this.tip);

      if (this.distance > this.radius) {
        this.tip.moveByAngle(this.angle, this.distance - this.radius);

        this.moved = true;
      }
    } else {
      this.angle = 0;

      this.distance = 0;

      this.moved = true;

      this.tip.update(point);
    }

    return true;
  }
}
