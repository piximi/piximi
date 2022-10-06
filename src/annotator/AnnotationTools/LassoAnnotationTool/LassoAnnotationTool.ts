import { AnnotationTool } from "../AnnotationTool";
import { encode } from "utils/annotator";
import { AnnotationStateType, Point } from "types";

export class LassoAnnotationTool extends AnnotationTool {
  anchor?: Point;
  buffer: Array<Point> = [];
  origin?: Point;
  points: Array<Point> = [];

  deselect() {
    this.annotation = undefined;

    this.anchor = undefined;
    this.buffer = [];
    this.origin = undefined;
    this.points = [];

    this.setBlank();
  }

  onMouseDown(position: { x: number; y: number }) {
    if (this.annotationState === AnnotationStateType.Annotated) return;

    if (this.annotationState === AnnotationStateType.Blank) {
      this.origin = position;
      this.buffer = [position, this.origin];

      this.setAnnotating();
    }
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationStateType.Annotating) return;
    if (
      Math.abs(this.buffer[this.buffer.length - 2].x - position.x) >= 1 ||
      Math.abs(this.buffer[this.buffer.length - 2].y - position.y) >= 1
    ) {
      this.buffer = [
        ...this.buffer.slice(0, this.buffer.length - 1),
        position,
        this.origin!,
      ];
    }
  }

  onMouseUp(position: { x: number; y: number }) {
    if (
      this.annotationState !== AnnotationStateType.Annotating ||
      !this.origin
    ) {
      return;
    }
    if (this.buffer.length < 6) {
      this.deselect();
      return;
    } else {
      this.points = this.buffer;

      this._boundingBox = this.computeBoundingBoxFromContours(this.points);

      const maskImage = this.computeAnnotationMaskFromPoints();

      if (!maskImage) {
        return;
      }

      this._mask = encode(maskImage.data);

      this.buffer = [];

      this.setAnnotated();
    }
  }
}
