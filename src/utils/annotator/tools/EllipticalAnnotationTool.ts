import { AnnotationStateType } from "../enums";
import { Point } from "../types";
import { AnnotationTool } from "./AnnotationTool";

export class EllipticalAnnotationTool extends AnnotationTool {
  center?: Point;
  radius?: { x: number; y: number };

  deselect() {
    this.center = undefined;
    this.origin = undefined;
    this.radius = undefined;
    this.annotation = undefined;
    this.setBlank();
  }

  onMouseDown(position: { x: number; y: number }) {
    if (this.annotationState === AnnotationStateType.Annotated) return;

    if (!this.radius) {
      this.origin = position;

      this.setAnnotating();
    }
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotationState === AnnotationStateType.Annotated) return;

    this.resize(position);
  }

  onMouseUp(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationStateType.Annotating || !this.radius)
      return;
    this.points = this.convertToPoints();

    this.setBoundingBoxFromContours(this.points);

    this.setAnnotationMaskFromPoints();

    if (!this.decodedMask) return;

    this.setAnnotated();
  }

  private convertToPoints() {
    if (!this.radius || !this.origin || !this.center) return [];

    const centerX = Math.round(this.center.x);
    const centerY = Math.round(this.center.y);
    const points: Array<Point> = [];

    const r = (
      theta: number,
      a: number = this.radius!.x,
      b: number = this.radius!.y
    ) => {
      return (
        (a * b) /
        Math.sqrt(b ** 2 * Math.cos(theta) ** 2 + a ** 2 * Math.sin(theta) ** 2)
      );
    };

    for (let theta = 0; theta <= 2 * Math.PI; theta += 0.05) {
      const x = r(theta) * Math.cos(theta) + centerX;
      const y = r(theta) * Math.sin(theta) + centerY;
      points.push({ x: x, y: y });
    }

    return points;
  }

  private resize(position: Point) {
    if (this.origin) {
      this.center = {
        x: (position.x - this.origin.x) / 2 + this.origin.x,
        y: (position.y - this.origin.y) / 2 + this.origin.y,
      };

      this.radius = {
        x: Math.abs((position.x - this.origin.x) / 2),
        y: Math.abs((position.y - this.origin.y) / 2),
      };
    }
  }
}
