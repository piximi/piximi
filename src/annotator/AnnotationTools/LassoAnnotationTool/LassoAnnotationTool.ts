import { AnnotationTool } from "../AnnotationTool";
import { encode } from "utils/annotator";
import { AnnotationStateType } from "types";

export class LassoAnnotationTool extends AnnotationTool {
  anchor?: { x: number; y: number };
  buffer: Array<number> = [];
  origin?: { x: number; y: number };
  points: Array<number> = [];

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

    if (this.buffer && this.buffer.length === 0) {
      if (!this.origin) {
        this.origin = position;
        this.buffer = [...this.buffer, position.x, position.y];
      }

      this.setAnnotating();
    }
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationStateType.Annotating) return;

    if (this.anchor) {
      if (
        this.buffer[this.buffer.length - 2] !== this.anchor.x ||
        this.buffer[this.buffer.length - 1] !== this.anchor.y
      ) {
        this.buffer.pop();
        this.buffer.pop();
      }

      this.buffer = [...this.buffer, position.x, position.y];

      return;
    }

    if (this.origin) {
      this.buffer = [...this.buffer, position.x, position.y];
    }
  }

  onMouseUp(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationStateType.Annotating || !this.origin)
      return;

    if (this.buffer.length < 3) return;

    if (this.origin && this.buffer && this.buffer.length > 0) {
      this.buffer = [
        ...this.buffer,
        position.x,
        position.y,
        this.origin.x,
        this.origin.y,
      ];

      this.points = this.buffer;

      this._boundingBox = this.computeBoundingBoxFromContours(this.points);

      const maskImage = this.computeAnnotationMaskFromPoints();
      if (!maskImage) return;

      this._mask = encode(maskImage.data);

      this.buffer = [];

      this.setAnnotated();
    }

    if (this.anchor) {
      this.anchor = {
        x: this.buffer[this.buffer.length - 2],
        y: this.buffer[this.buffer.length - 1],
      };

      return;
    }

    if (this.origin && this.buffer && this.buffer.length > 0) {
      this.anchor = {
        x: this.buffer[this.buffer.length - 2],
        y: this.buffer[this.buffer.length - 1],
      };

      return;
    }
  }
}
