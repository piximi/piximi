import { AnnotationTool } from "../AnnotationTool";
import { encode } from "../../../rle";

export class PolygonalAnnotationTool extends AnnotationTool {
  anchor?: { x: number; y: number };
  buffer: Array<number> = [];
  origin?: { x: number; y: number };
  points: Array<number> = [];

  deselect() {
    this.annotated = false;
    this.annotating = false;

    this.annotation = undefined;

    this.anchor = undefined;
    this.buffer = [];
    this.origin = undefined;
    this.points = [];
  }

  onMouseDown(position: { x: number; y: number }) {
    if (this.annotated) return;

    if (this.buffer && this.buffer.length === 0) {
      this.annotating = true;

      if (!this.origin) {
        this.origin = position;
      }
    }
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotated || !this.annotating) return;

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
    if (this.annotated || !this.annotating) return;

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

      this.annotated = true;
      this.annotating = false;

      this.points = this.buffer;

      this._boundingBox = this.computeBoundingBoxFromContours(this.points);

      const maskImage = this.computeMask().crop({
        x: this._boundingBox[0],
        y: this._boundingBox[1],
        width: this._boundingBox[2] - this._boundingBox[0],
        height: this._boundingBox[3] - this._boundingBox[1],
      });

      this._mask = encode(maskImage.data);

      this.buffer = [];

      this.anchor = undefined;
      this.origin = undefined;

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
