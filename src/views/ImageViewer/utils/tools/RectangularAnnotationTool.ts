import { AnnotationState } from "../enums";
import { AnnotationTool } from "./AnnotationTool";
import { drawRectangle } from "views/ImageViewer/utils";

export class RectangularAnnotationTool extends AnnotationTool {
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
    if (this.annotationState === AnnotationState.Annotated) return;

    // Needed for touch events
    if (this.annotationState === AnnotationState.Annotating) {
      this.resize(position);
      return;
    }
    if (!this.width) {
      this.origin = position;
      this.setAnnotating();
    }
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationState.Annotating) return;
    this.resize(position);
  }

  onMouseUp(position: { x: number; y: number }) {
    if (
      this.annotationState !== AnnotationState.Annotating ||
      !(this.width && this.height)
    )
      return;

    if (Math.abs(this.width * this.height) < 10) {
      return;
    }
    this.resize(position);
    this.points = drawRectangle(this.origin, this.width, this.height);
    this._boundingBox = this.computeBoundingBox();

    const decodedMask = this.convertToMask();
    if (!decodedMask) return;

    this._decodedMask = decodedMask;
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
