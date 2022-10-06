import * as ImageJS from "image-js";

import { AnnotationTool } from "../AnnotationTool";
import { encode } from "utils/annotator";

import { connectPoints } from "utils/common";

import { AnnotationStateType, Point } from "types";

export class PenAnnotationTool extends AnnotationTool {
  brushSize: number = 8;
  buffer: Array<Point> = [];
  points: Array<Point> = [];

  deselect() {
    this.buffer = [];
    this.points = [];

    this.setBlank();
  }

  onMouseDown(position: { x: number; y: number }) {
    if (this.annotationState === AnnotationStateType.Annotated) return;

    this.buffer = [...this.buffer, position];

    this.setAnnotating();
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationStateType.Annotating) return;

    this.buffer = [...this.buffer, position];
  }

  onMouseUp(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationStateType.Annotating) return;

    this.points = this.buffer;

    const circlesData = this.computeCircleData();

    if (!circlesData) {
      this.deselect();
      return;
    }

    this._mask = encode(circlesData);

    this.setAnnotated();
  }

  private computeCircleData(): Uint8Array | Uint8ClampedArray | undefined {
    const canvas = document.createElement("canvas");
    canvas.width = this.image.width;
    canvas.height = this.image.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return undefined;

    let connectedPoints: Array<Point>;
    if (this.points.length === 1) {
      // Handling the case in which a single point has been clicked.
      connectedPoints = this.points;
    } else {
      connectedPoints = connectPoints(this.points);
    }
    // Compute bounding box coordinates.
    const boundingBox = this.computeBoundingBoxFromContours(connectedPoints);

    // Make sure the bounding box is valid.
    if (boundingBox.some((x) => Number.isNaN(x))) return undefined;

    this._boundingBox = [
      Math.max(0, Math.round(boundingBox[0] - this.brushSize)),
      Math.max(0, Math.round(boundingBox[1] - this.brushSize)),
      Math.min(this.image.width, Math.round(boundingBox[2] + this.brushSize)),
      Math.min(this.image.height, Math.round(boundingBox[3] + this.brushSize)),
    ];

    // Compute mask by drawing circles over canvas.
    connectedPoints.forEach((point) => {
      ctx.beginPath();
      ctx.arc(
        Math.round(point.x),
        Math.round(point.y),
        this.brushSize,
        0,
        Math.PI * 2,
        true
      );
      ctx.fill();
    });

    const rgbMask = ImageJS.Image.fromCanvas(canvas);

    const width = this._boundingBox[2] - this._boundingBox[0];
    const height = this._boundingBox[3] - this._boundingBox[1];
    if (width <= 0 || height <= 0) {
      return undefined;
    }

    const croppedRgbMask = rgbMask.crop({
      x: this._boundingBox[0],
      y: this._boundingBox[1],
      width: width,
      height: height,
    });

    // @ts-ignore: getChannel API is not exposed
    const thresholdMaskImg = this.thresholdMask(croppedRgbMask.getChannel(3));
    return thresholdMaskImg.data as Uint8Array;
  }

  private thresholdMask = (mask: ImageJS.Image) => {
    for (let x = 0; x < mask.width; x++) {
      for (let y = 0; y < mask.height; y++) {
        if (mask.getPixelXY(x, y)[0] > 1) {
          mask.setPixelXY(x, y, [255]);
        } else {
          mask.setPixelXY(x, y, [0]);
        }
      }
    }
    return mask;
  };
}
