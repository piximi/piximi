import { AnnotationTool } from "../AnnotationTool";
import { encode } from "../../../rle";
import { AnnotationStateType } from "../../../../../types/AnnotationStateType";
import * as ImageJS from "image-js";

export class ThresholdAnnotationTool extends AnnotationTool {
  origin?: { x: number; y: number };
  threshold = 255;
  width?: number;
  height?: number;

  static setup(image: ImageJS.Image) {
    const instance = new ThresholdAnnotationTool(image);

    return instance;
  }

  updateMask(threshold: number) {
    this.threshold = Math.round(threshold);

    if (this.mask) {
      const maskImg = this.applyThreshold();

      this._mask = encode(maskImg);

      this.setAnnotated();
    }
  }

  computeBoundingBox(): [number, number, number, number] | undefined {
    if (!this.points || !this.points.length) return undefined;
    return [this.points[0], this.points[1], this.points[4], this.points[5]];
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

      this.points = this.convertToPoints();

      this._boundingBox = this.computeBoundingBox();

      this.setAnnotated();
    }
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationStateType.Annotating) return;

    this.resize(position);
  }

  onMouseUp(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationStateType.Annotating) return;

    if (this.width) {
      this.points = this.convertToPoints();

      this._boundingBox = this.computeBoundingBox();

      const mask = this.convertToMask();
      if (!mask || !this.origin || !this._boundingBox) return;

      const thresholdMask = this.applyThreshold();
      if (!thresholdMask) {
        return;
      }
      this._mask = encode(thresholdMask);

      this.setAnnotated();
    }
  }

  private applyThreshold() {
    this.points = this.convertToPoints();

    const x1 = this.points[0];
    const y1 = this.points[1];
    const x2 = this.points[4];
    const y2 = this.points[5];

    let width = x2 - x1;
    let height = y2 - y1;

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

    //negative height and width may happen if the rectangle was drawn from right to left
    if (this.width < 0) {
      width = Math.abs(this.width);
      origin.x = this.origin.x - width;
    }
    if (this.height < 0) {
      height = Math.abs(this.height);
      origin.y = this.origin.y - height;
    }

    // add corners of the rectangle
    const x1 = Math.round(origin.x);
    const y1 = Math.round(origin.y);
    const x2 = Math.round(origin.x + width);
    const y2 = Math.round(origin.y + height);
    //0   1           4   5
    points.push(...[x1, y1, x2, y1, x2, y2, x1, y2, x1, y1]);

    return points;
  }

  private convertToMask() {
    if (!this.points || !this.boundingBox) return;

    const x1 = this.points[0];
    const y1 = this.points[1];
    const x2 = this.points[4];
    const y2 = this.points[5];

    return new Uint8Array((x2 - x1) * (y2 - y1)).fill(255);
  }

  private resize(position: { x: number; y: number }) {
    if (this.origin) {
      this.width = position.x - this.origin.x;
      this.height = position.y - this.origin.y;
    }
  }
}
