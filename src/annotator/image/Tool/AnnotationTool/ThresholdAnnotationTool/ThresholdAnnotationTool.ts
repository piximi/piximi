import { AnnotationTool } from "../AnnotationTool";
import { encode } from "../../../rle";
import { AnnotationStateType } from "types/AnnotationStateType";

export class ThresholdAnnotationTool extends AnnotationTool {
  // TODO: ts throws error on this overwriting AnnotationTool property
  // origin?: { x: number; y: number };
  threshold = 255;
  width?: number;
  height?: number;

  updateMask(threshold: number) {
    this.threshold = Math.round(threshold);

    if (this.mask) {
      if (!this._boundingBox) return;
      const maskImg = this.applyThreshold(this._boundingBox);

      if (!maskImg) {
        this.deselect();
        return;
      }

      this._mask = encode(maskImg);

      this.setAnnotated();
    }
  }

  deselect() {
    this.origin = undefined;

    this.width = undefined;
    this.height = undefined;

    this.setBlank();
  }

  onMouseDown(position: { x: number; y: number }) {
    if (this.annotationState === AnnotationStateType.Annotated) return;

    if (!this.width) {
      this.origin = position;

      this.setAnnotating();
    } else {
      this.resize(position);

      this.computeMask();
    }
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationStateType.Annotating) return;

    this.resize(position);
  }

  onMouseUp(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationStateType.Annotating) return;

    this.computeMask();
  }

  computeMask() {
    this.points = this.convertToPoints();

    const boundingBox = this.computeBoundingBox();
    this._boundingBox = boundingBox;

    if (!boundingBox) return;

    const thresholdMask = this.applyThreshold(boundingBox);
    if (!thresholdMask) {
      this.deselect();
      return;
    }

    this._mask = encode(thresholdMask);

    this.setAnnotated();
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
        const imgI = y1 + i;
        const imgJ = x1 + j;
        const imgIdx = imgI * this.image.width + imgJ;
        if (binaryMask[imgIdx] > this.threshold) {
          thresholdMask[i * width + j] = 255;
        }
      }
    }

    return thresholdMask;
  }

  private convertToPoints() {
    if (!this.width || !this.height || !this.origin) return [];

    const points: Array<number> = [];

    const origin = { x: this.origin.x, y: this.origin.y };
    let width = this.width;
    let height = this.height;

    // Negative height and width may happen if the rectangle was drawn from right to left.
    if (this.width < 0) {
      width = Math.abs(this.width);
      origin.x = this.origin.x - width;
    }
    if (this.height < 0) {
      height = Math.abs(this.height);
      origin.y = this.origin.y - height;
    }

    // Add corners of the bounding box.
    const x1 = Math.round(origin.x);
    const y1 = Math.round(origin.y);
    const x2 = Math.round(origin.x + width);
    const y2 = Math.round(origin.y + height);
    points.push(...[x1, y1, x2, y1, x2, y2, x1, y2, x1, y1]);

    return points;
  }

  private resize(position: { x: number; y: number }) {
    if (this.origin) {
      this.width = position.x - this.origin.x;
      this.height = position.y - this.origin.y;
    }
  }
}
