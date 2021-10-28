import { AnnotationTool } from "../AnnotationTool";
import * as ImageJS from "image-js";
import * as _ from "lodash";
import { connectPoints } from "../../../imageHelper";
import { encode } from "../../../rle";

export class PenAnnotationTool extends AnnotationTool {
  brushSize: number = 8;
  circlesData: Uint8ClampedArray | Uint8Array | undefined = undefined;
  buffer: Array<number> = [];
  outline: Array<number> = [];
  points: Array<number> = [];

  computeCircleData(): Uint8Array | Uint8ClampedArray | undefined {
    const canvas = document.createElement("canvas");
    canvas.width = this.image.width;
    canvas.height = this.image.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return undefined;

    let connected;

    if (this.points.length === 2) {
      // handling the case in which a single point has been clicked
      connected = _.chunk(this.points, 2);
    } else {
      connected = connectPoints(
        _.chunk(this.points, 2),
        new ImageJS.Image(this.image.width, this.image.height)
      );
    }

    //compute bounding box coordinates
    const bbox = this.computeBoundingBoxFromContours(_.flatten(connected));
    this._boundingBox = [
      Math.max(0, Math.round(bbox[0] - this.brushSize)),
      Math.max(0, Math.round(bbox[1] - this.brushSize)),
      Math.min(this.image.width, Math.round(bbox[2] + this.brushSize)),
      Math.min(this.image.height, Math.round(bbox[3] + this.brushSize)),
    ];

    //compute mask by drawing circles over canvas
    connected.forEach((position) => {
      ctx.beginPath();
      ctx.arc(
        Math.round(position[0]),
        Math.round(position[1]),
        this.brushSize,
        0,
        Math.PI * 2,
        true
      );
      ctx.fill();
    });

    const rgbMask = ImageJS.Image.fromCanvas(canvas);

    const croppedRgbMask = rgbMask.crop({
      x: this._boundingBox[0],
      y: this._boundingBox[1],
      width: this._boundingBox[2] - this._boundingBox[0],
      height: this._boundingBox[3] - this._boundingBox[1],
    });

    // @ts-ignore
    this.circlesData = this.thresholdMask(croppedRgbMask.getChannel(3)).data;
  }

  deselect() {
    this.annotated = false;
    this.annotating = false;

    this.circlesData = undefined;
    this.buffer = [];
    this.outline = [];
    this.points = [];
  }

  onMouseDown(position: { x: number; y: number }) {
    if (this.annotated) return;

    this.annotating = true;

    this.buffer = [...this.buffer, position.x, position.y];
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotated || !this.annotating) return;

    this.buffer = [...this.buffer, position.x, position.y];
  }

  onMouseUp(position: { x: number; y: number }) {
    if (this.annotated || !this.annotating) return;

    this.annotated = true;

    this.annotating = false;

    this.points = this.buffer;

    this.computeCircleData(); //this will set the bounding box as well

    if (!this.circlesData) return [];

    this._mask = encode(this.circlesData);
  }

  static async setup(image: ImageJS.Image, brushSize: number) {
    const operator = new PenAnnotationTool(image);

    operator.brushSize = brushSize;

    return operator;
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
