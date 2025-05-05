import { AnnotationState } from "../enums";
import { Point } from "utils/types";
import { AnnotationTool } from "./AnnotationTool";

export class LassoAnnotationTool extends AnnotationTool {
  buffer: Array<Point> = [];
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
    if (this.annotationState === AnnotationState.Annotated) return;

    if (this.annotationState === AnnotationState.Blank) {
      this.origin = position;
      this.buffer = [position, this.origin];

      this.setAnnotating();
    }
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationState.Annotating) return;
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

  onMouseUp(_position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationState.Annotating || !this.origin) {
      return;
    }
    if (this.buffer.length < 6) {
      this.deselect();
      return;
    } else {
      this.points = this.buffer;

      this.setBoundingBoxFromContours(this.points);

      this.setAnnotationMaskFromPoints();

      if (!this.decodedMask) {
        return;
      }

      this.buffer = [];

      this.setAnnotated();
    }
  }
}
