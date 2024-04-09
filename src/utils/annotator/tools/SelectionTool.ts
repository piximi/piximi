import { AnnotationStateType } from "../enums";
import { AnnotationTool } from "./AnnotationTool";
import { drawRectangle } from "utils/annotator";

export class SelectionTool extends AnnotationTool {
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
    if (this.annotationState !== AnnotationStateType.Annotating) return;

    if (
      !(this.width && this.height) ||
      Math.abs(this.width * this.height) < 10
    ) {
      this.deselect();
      return;
    }
    this.resize(position);
    this.points = drawRectangle(this.origin, this.width, this.height);
    this._boundingBox = this.computeBoundingBox();

    this.deselect();
  }

  private resize(position: { x: number; y: number }) {
    if (this.origin) {
      this.width = position.x - this.origin.x;
      this.height = position.y - this.origin.y;
    }
  }
}
