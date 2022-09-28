import { AnnotationTool } from "../AnnotationTool";
import { encode } from "utils/annotator";
import { AnnotationStateType } from "types";

export class LassoAnnotationTool extends AnnotationTool {
  // TODO: ts throws error on this overwriting AnnotationTool property
  // anchor?: { x: number; y: number };
  buffer: Array<number> = [];
  // TODO: ts throws error on this overwriting AnnotationTool property
  // origin?: { x: number; y: number };
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

    if (this.annotationState === AnnotationStateType.Blank) {
      this.origin = position;
      this.buffer = [position.x, position.y, this.origin.x, this.origin.y];

      this.setAnnotating();
    }
    // console.log("MouseDown at ", position);
    // console.log("Buffer: ", this.buffer);
    // console.log("Anchor: ", this.anchor);
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationStateType.Annotating) return;
    if (
      Math.abs(this.buffer[this.buffer.length - 4] - position.x) >= 1 ||
      Math.abs(this.buffer[this.buffer.length - 3] - position.y) >= 1
    ) {
      // console.log("MouseMove at ", position);
      // console.log("Buffer: ", this.buffer);
      // console.log("Anchor: ", this.anchor);

      // if (this.anchor) {
      //   if (
      //     this.buffer[this.buffer.length - 2] !== this.anchor.x ||
      //     this.buffer[this.buffer.length - 1] !== this.anchor.y
      //   ) {
      //     this.buffer.pop();
      //     this.buffer.pop();
      //   }

      //   this.buffer = [...this.buffer, position.x, position.y];

      //   return;
      // }
      // this.buffer.pop();
      // this.buffer.pop();

      this.buffer = [
        ...this.buffer.slice(0, this.buffer.length - 2),
        position.x,
        position.y,
        this.origin!.x,
        this.origin!.y,
      ];
    }
  }

  onMouseUp(position: { x: number; y: number }) {
    if (
      this.annotationState !== AnnotationStateType.Annotating ||
      !this.origin
    ) {
      return;
    }
    if (this.origin && this.buffer.length < 6) {
      this.deselect();
      return;
    }

    if (
      this.origin &&
      this.buffer.length >= 6 /*&& this.connected(position)*/
    ) {
      // this.buffer = [
      //   ...this.buffer,
      //   position.x,
      //   position.y,
      //   this.origin.x,
      //   this.origin.y,
      // ];

      this.points = this.buffer;

      this._boundingBox = this.computeBoundingBoxFromContours(this.points);

      const maskImage = this.computeAnnotationMaskFromPoints();

      if (!maskImage) {
        return;
      }

      this._mask = encode(maskImage.data);

      this.buffer = [];

      this.setAnnotated();
    }

    // if (this.anchor) {
    //   this.anchor = {
    //     x: this.buffer[this.buffer.length - 2],
    //     y: this.buffer[this.buffer.length - 1],
    //   };

    //   return;
    // }
    // if (this.origin && this.buffer && this.buffer.length > 0) {
    //   this.anchor = {
    //     x: this.buffer[this.buffer.length - 2],
    //     y: this.buffer[this.buffer.length - 1],
    //   };
    // console.log("MouseUp at ", position);
    // console.log("Buffer: ", this.buffer);
    // console.log("Anchor: ", this.anchor);

    //   return;
    // }
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
