import IJSImage from "image-js";

import { AnnotationTool } from "./AnnotationTool";

import {
  connectPoints,
  computeBoundingBoxFromContours,
} from "views/ImageViewer/utils";
import { Point } from "utils/types";
import { AnnotationState } from "../enums";

export class PenAnnotationTool extends AnnotationTool {
  brushSize: number = 8;
  buffer: Array<Point> = [];
  points: Array<Point> = [];

  deselect() {
    this.buffer = [];
    this.points = [];
    this.annotation = undefined;

    this.setBlank();
  }

  onMouseDown(position: { x: number; y: number }) {
    if (this.annotationState === AnnotationState.Annotated) return;

    this.buffer = [...this.buffer, position];

    this.setAnnotating();
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationState.Annotating) return;

    this.buffer = [...this.buffer, position];
  }

  onMouseUp(_position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationState.Annotating) return;

    this.points = this.buffer;

    const circlesData = this.computeCircleData();

    if (!circlesData) {
      this.deselect();
      return;
    }

    this.decodedMask = circlesData;

    this.setAnnotated();
  }

  private computeCircleData(): Uint8Array | undefined {
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
    // don't use this this.setBoundingBoxFromContours here
    const boundingBox = computeBoundingBoxFromContours(connectedPoints);

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
        true,
      );
      ctx.fill();
    });

    const rgbMask = IJSImage.fromCanvas(canvas);

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

  private thresholdMask = (mask: IJSImage) => {
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
