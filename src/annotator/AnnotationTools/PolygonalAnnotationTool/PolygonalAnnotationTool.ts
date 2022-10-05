import { AnnotationTool } from "../AnnotationTool";
import { encode } from "utils/annotator";
import { AnnotationStateType, Point } from "types";
import { generatePoints } from "utils/common/imageHelper";

export class PolygonalAnnotationTool extends AnnotationTool {
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
        this.buffer[this.buffer.length - 1].x !== this.anchor.x ||
        this.buffer[this.buffer.length - 1].y !== this.anchor.y
      ) {
        this.buffer.pop();
      }

      this.buffer = [...this.buffer, position];

      return;
    }

    if (this.origin) {
      this.buffer.pop();

      this.buffer = [this.origin, position];
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
      this.buffer = [...this.buffer, position, this.origin];

      this.points = this.buffer;

      this._boundingBox = this.computeBoundingBoxFromContours(this.points);

      const maskImage = this.computeAnnotationMaskFromPoints();
      if (!maskImage) return;

      this._mask = encode(maskImage.data);

      this.buffer = [];

      this.anchor = undefined;
      this.origin = undefined;

      this.setAnnotated();
      return;
    }

    if (this.anchor || (this.origin && this.buffer.length > 0)) {
      this.anchor = {
        x: this.buffer[this.buffer.length - 1].x,
        y: this.buffer[this.buffer.length - 1].y,
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
