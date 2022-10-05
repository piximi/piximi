import * as _ from "lodash";
import * as ImageJS from "image-js";
import { AnnotationTool } from "../AnnotationTool";

import { encode } from "utils/annotator";
import { AnnotationStateType, Point } from "types";
import { generatePoints } from "utils/common/imageHelper";

export class EllipticalAnnotationTool extends AnnotationTool {
  center?: Point;
  origin?: Point;
  radius?: { x: number; y: number };

  deselect() {
    this.center = undefined;
    this.origin = undefined;
    this.radius = undefined;

    this.setBlank();
  }

  onMouseDown(position: { x: number; y: number }) {
    if (this.annotationState === AnnotationStateType.Annotated) return;

    if (!this.radius) {
      this.origin = position;

      this.setAnnotating();
    }
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotationState === AnnotationStateType.Annotated) return;

    this.resize(position);
  }

  onMouseUp(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationStateType.Annotating) return;

    if (this.radius) {
      this.points = this.convertToPoints();

      this._boundingBox = this.computeBoundingBoxFromContours(this.points!);
      const mask = this.convertToMask();

      if (!mask) return;

      this._mask = encode(mask);

      this.setAnnotated();
    }
  }

  private convertToMask() {
    if (!this.boundingBox) return;

    const canvas = document.createElement("canvas");
    canvas.width = this.image.width;
    canvas.height = this.image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx || !this.center || !this.radius) return undefined;

    ctx.beginPath();
    ctx.ellipse(
      this.center.x,
      this.center.y,
      this.radius.x,
      this.radius.y,
      2 * Math.PI,
      0,
      2 * Math.PI
    );
    ctx.fill();

    const roiWidth = this.boundingBox[2] - this.boundingBox[0];
    const roiHeight = this.boundingBox[3] - this.boundingBox[1];

    if (!roiWidth || !roiHeight) return undefined;

    // @ts-ignore: getChannel API is not exposed
    const imageMask = ImageJS.Image.fromCanvas(canvas).getChannel(3);

    const croppedImageMask = new ImageJS.Image(roiWidth, roiHeight, {
      components: 1,
      alpha: 0,
    });

    for (let x = 0; x < roiWidth; x++) {
      for (let y = 0; y < roiHeight; y++) {
        if (
          imageMask.getPixelXY(
            x + this.boundingBox[0],
            y + this.boundingBox[1]
          )[0] > 1
        ) {
          croppedImageMask.setPixelXY(x, y, [255]);
        } else {
          croppedImageMask.setPixelXY(x, y, [0]);
        }
      }
    }

    return Uint8Array.from(croppedImageMask.data);
  }

  private convertToPoints() {
    if (!this.radius || !this.origin || !this.center) return [];

    const centerX = Math.round(this.center.x);
    const centerY = Math.round(this.center.y);

    const points: Array<Point> = [];
    const foo: Array<Point> = [];
    const doints: Array<Point> = [];

    const r = (
      theta: number,
      a: number = this.radius!.x,
      b: number = this.radius!.y
    ) => {
      return (
        (a * b) / Math.sqrt(b ** 2 * Math.cos(theta) + a ** 2 * Math.sin(theta))
      );
    };

    for (let theta = 0; theta <= 2 * Math.PI; theta += 0.05) {
      const x = r(theta) * Math.cos(theta) + centerX;
      const y = r(theta) * Math.sin(theta) + centerY;
      doints.push({ x: x, y: y });
    }
    //first quadrant points
    for (let y = centerY; y < centerY + this.radius.y; y += 0.5) {
      const x =
        this.radius.x *
          Math.sqrt(
            1 -
              ((y - centerY) * (y - centerY)) / (this.radius.y * this.radius.y)
          ) +
        centerX;
      points.push({ x: Math.round(x), y: Math.round(y) });
      foo.push({ x: Math.round(x), y: Math.round(y) });
    }
    //second quadrant points
    _.forEachRight(foo, (position: Point) => {
      let x = 2 * centerX - position.x;
      points.push({ x: x, y: position.y });
    });
    //third quadrant points
    _.forEach(foo, (position: Point) => {
      let x = 2 * centerX - position.x;
      let y = 2 * centerY - position.y;
      points.push({ x: x, y: y });
    });
    //fourth quadant points
    _.forEachRight(foo, (position: Point) => {
      let y = 2 * centerY - position.y;
      points.push({ x: position.x, y: y });
    });

    return points;
  }

  private resize(position: Point) {
    if (this.origin) {
      this.center = {
        x: (position.x - this.origin.x) / 2 + this.origin.x,
        y: (position.y - this.origin.y) / 2 + this.origin.y,
      };

      this.radius = {
        x: Math.abs((position.x - this.origin.x) / 2),
        y: Math.abs((position.y - this.origin.y) / 2),
      };
    }
  }
}
