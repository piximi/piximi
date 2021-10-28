import { AnnotationTool } from "../AnnotationTool";
import * as ImageJS from "image-js";
import { encode } from "../../../rle";

export class RectangularAnnotationTool extends AnnotationTool {
  origin?: { x: number; y: number };

  width?: number;
  height?: number;

  computeBoundingBox(): [number, number, number, number] | undefined {
    if (!this.points || !this.points.length) return undefined;
    return [this.points[0], this.points[1], this.points[4], this.points[5]];
  }

  deselect() {
    this.annotated = false;
    this.annotating = false;

    this.origin = undefined;

    this.width = undefined;
    this.height = undefined;
  }

  onMouseDown(position: { x: number; y: number }) {
    if (this.annotated) return;

    if (!this.width) {
      this.origin = position;

      this.annotating = true;
    } else {
      this.resize(position);

      this.points = this.convertToPoints();

      this._boundingBox = this.computeBoundingBox();

      const mask = this.convertToMask();
      if (!mask) return;
      this._mask = encode(new Uint8Array(mask));

      this.annotated = true;
      this.annotating = false;
    }
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotated) return;

    this.resize(position);
  }

  onMouseUp(position: { x: number; y: number }) {
    if (this.annotated || !this.annotating) return;
    if (this.width) {
      this.points = this.convertToPoints();

      this._boundingBox = this.computeBoundingBox();

      const mask = this.convertToMask();
      if (!mask) return;
      this._mask = encode(new Uint8Array(mask));

      this.annotated = true;
      this.annotating = false;
    }
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
