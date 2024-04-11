import { AnnotationState } from "../enums";
import { AnnotationTool } from "./AnnotationTool";
import { drawRectangle } from "utils/annotator";

export class ThresholdAnnotationTool extends AnnotationTool {
  threshold = 255;
  width?: number;
  height?: number;

  updateMask(threshold: number) {
    this.threshold = Math.round(threshold);
    if (this.decodedMask) {
      if (!this._boundingBox) return;

      const maskImg = this.applyThreshold(this._boundingBox);

      if (!maskImg) {
        this.deselect();
        return;
      }

      this.decodedMask = maskImg;

      this.setAnnotated();
    }
  }

  deselect() {
    this.origin = undefined;

    this.width = undefined;
    this.height = undefined;

    this.setBlank();
    this.annotation = undefined;
  }

  onMouseDown(position: { x: number; y: number }) {
    if (this.annotationState === AnnotationState.Annotated) return;

    if (!this.width) {
      this.origin = position;

      this.setAnnotating();
    } else {
      this.resize(position);

      this.computeMask();
    }
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationState.Annotating) return;

    this.resize(position);
  }

  onMouseUp(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationState.Annotating) return;

    this.computeMask();
    this.setAnnotated();
  }

  computeMask() {
    this.points = drawRectangle(this.origin, this.width, this.height);

    const boundingBox = this.computeBoundingBox();
    this._boundingBox = boundingBox;

    if (!boundingBox) return;

    const thresholdMask = this.applyThreshold(boundingBox);
    if (!thresholdMask) {
      this.deselect();
      return;
    }

    this.decodedMask = thresholdMask;
  }

  private applyThreshold(boundingBox: [number, number, number, number]) {
    const x1 = boundingBox[0];
    const y1 = boundingBox[1];

    const width = boundingBox[2] - boundingBox[0];
    const height = boundingBox[3] - boundingBox[1];

    if (width <= 0 || height <= 0) {
      return undefined;
    }

    const image = this.image;
    const greyMask = image.grey();

    const binaryMask = greyMask.data as Uint8Array;

    const thresholdMask = new Uint8Array(width * height);

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const imgY = y1 + i;
        const imgX = x1 + j;
        const imgIdx = imgY * this.image.width + imgX;
        if (binaryMask[imgIdx] > this.threshold) {
          thresholdMask[i * width + j] = 255;
        }
      }
    }

    return thresholdMask;
  }

  private resize(position: { x: number; y: number }) {
    if (this.origin) {
      this.width = position.x - this.origin.x;
      this.height = position.y - this.origin.y;
    }
  }
}
