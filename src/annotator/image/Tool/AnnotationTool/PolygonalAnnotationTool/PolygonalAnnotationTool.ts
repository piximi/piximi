import { AnnotationTool } from "../AnnotationTool";
import { encode } from "../../../rle";
import { AnnotationStateType } from "types/AnnotationStateType";

export class PolygonalAnnotationTool extends AnnotationTool {
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
      this.buffer.pop();
      this.buffer.pop();

      this.buffer = [this.origin.x, this.origin.y, position.x, position.y];
    }
  }

  onMouseUp(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationStateType.Annotating) return;

    if (
      this.connected(position) &&
      this.origin &&
      this.buffer &&
      this.buffer.length > 0
    ) {
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

      //@ts-expect-error: TODO: image_data
      this._mask = encode(maskImage.data);

      this.buffer = [];

      this.anchor = undefined;
      this.origin = undefined;

      this.setAnnotated();
      return;
    }

    if (this.anchor) {
      this.anchor = {
        x: this.buffer[this.buffer.length - 2],
        y: this.buffer[this.buffer.length - 1],
      };

      return;
    }

    if (this.origin && this.buffer.length > 0) {
      this.anchor = {
        x: this.buffer[this.buffer.length - 2],
        y: this.buffer[this.buffer.length - 1],
      };

      return;
    }
  }

  private connected(
    position: { x: number; y: number },
    threshold: number = 4
  ): boolean | undefined {
    if (!this.origin) return undefined;

    const distance = Math.hypot(
      position.x - this.origin.x,
      position.y - this.origin.y
    );

    return distance < threshold;
  }
}
