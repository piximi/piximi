import { AnnotationTool } from "../AnnotationTool";
import { AnnotationStateType, Point } from "types";
import { drawRectangle } from "utils/common/imageHelper";

export class RectangularAnnotationTool extends AnnotationTool {
  origin?: Point;
  width?: number;
  height?: number;

  deselect() {
    this.origin = undefined;

    this.width = undefined;
    this.height = undefined;
    this.annotation = undefined;

    this.setBlank();
  }

  onMouseDown(position: { x: number; y: number }) {
    if (this.annotationState === AnnotationStateType.Annotated) return;
    if (!this.width) {
      this.origin = position;
      this.setAnnotating();
    }
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationStateType.Annotating) return;
    this.resize(position);
  }

  onMouseUp(position: { x: number; y: number }) {
    if (
      this.annotationState !== AnnotationStateType.Annotating ||
      !(this.width && this.height)
    )
      return;

    if (Math.abs(this.width * this.height) < 10) {
      return;
    }
    this.resize(position);
    this.points = drawRectangle(this.origin, this.width, this.height);
    this._boundingBox = this.computeBoundingBox();

    const maskData = this.convertToMask();
    if (!maskData) return;

    this._maskData = maskData;
    this.setAnnotated();
  }

  private convertToMask() {
    if (!this.points || !this.boundingBox) return;

    const p1 = this.points[0];
    const p2 = this.points[1];

    return new Uint8Array((p2.x - p1.x) * (p2.y - p1.y)).fill(255);
  }

  private resize(position: { x: number; y: number }) {
    if (this.origin) {
      this.width = position.x - this.origin.x;
      this.height = position.y - this.origin.y;
    }
  }
}