import { AnnotationTool } from "../AnnotationTool";
import { getDistance, pointsAreEqual } from "utils/annotator";
import { AnnotationStateType, Point } from "types";

export class PolygonalAnnotationTool extends AnnotationTool {
  buffer: Array<Point> = [];
  points: Array<Point> = [];
  private _initialMove: boolean = true;

  set newAnchor(position: Point | undefined) {
    if (position) {
      this._initialMove = true;
      this.anchor = position;
    } else {
      this._initialMove = true;
      this.anchor = undefined;
    }
  }

  set terminal(position: Point) {
    if (this._initialMove) {
      this._initialMove = false;
      this.buffer.push(position);
    } else {
      this.buffer[this.buffer.length - 1] = position;
    }
  }

  deselect() {
    this.annotation = undefined;
    this.newAnchor = undefined;
    this.buffer = [];
    this.origin = undefined;
    this.points = [];
    this.setBlank();
  }

  onMouseDown(position: { x: number; y: number }) {
    if (this.annotationState === AnnotationStateType.Annotated) return;

    if (!this.origin) {
      this.origin = position;
      this.buffer.push(position);

      this.setAnnotating();
    }
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationStateType.Annotating) return;
    if (this.anchor && pointsAreEqual(this.anchor, position)) return;

    this.terminal = position;
  }

  onMouseUp(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationStateType.Annotating) return;

    if (
      this.connected(position) &&
      this.anchor &&
      this.origin &&
      this.buffer &&
      this.buffer.length > 0
    ) {
      this.buffer = [...this.buffer, position, this.origin];
      this.points = this.buffer;

      this.setBoundingBoxFromContours(this.points);

      this.setAnnotationMaskFromPoints();

      if (!this.maskData) return;

      this.buffer = [];
      this.newAnchor = undefined;
      this.origin = undefined;

      this.setAnnotated();
    } else {
      this.newAnchor = this.buffer.at(-1);
    }
  }

  private connected(
    position: Point,
    threshold: number = 4
  ): boolean | undefined {
    if (!this.origin) return undefined;

    const distance = getDistance(position, this.origin);

    return distance < threshold;
  }
}
