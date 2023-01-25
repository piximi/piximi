import * as ImageJS from "image-js";

import { AnnotationTool } from "../AnnotationTool";

import { AnnotationStateType } from "types";
import { slic } from "utils/annotator";

export class QuickAnnotationTool extends AnnotationTool {
  regionSize?: number;
  colorMasks?: Array<string>;
  currentSuperpixels: Set<number> = new Set<number>();
  lastSuperpixel: number = 0;
  superpixels?: Int32Array;
  superpixelsMap?: { [key: number]: Array<number> };
  currentMask?: ImageJS.Image;
  map?: Uint8Array | Uint8ClampedArray;
  startAnnotating = false;
  throttleTimer: boolean = false;

  // throttled to prevent repeated expensive calls while resizing
  initializeSuperpixels(regionSize: number) {
    if (this.throttleTimer) return;
    this.throttleTimer = true;
    setTimeout(() => {
      this.regionSize = Math.round(regionSize);

      const superpixels = this.computeSuperpixels();

      if (!superpixels.length) return;

      this.superpixels = superpixels;
      this.superpixelsMap = {};

      superpixels.forEach((pixel: number, index: number) => {
        if (!(pixel in this.superpixelsMap!)) {
          this.superpixelsMap![pixel] = [];
        }
        this.superpixelsMap![pixel].push(index);
      });
      this.throttleTimer = false;
    }, 500);
  }

  computeSuperpixels() {
    const data = this.image.getRGBAData();

    const { superpixels } = slic(
      data,
      this.image.width,
      this.image.height,
      this.regionSize
    );

    return superpixels;
  }

  deselect() {
    this.colorMasks = undefined;
    this.currentSuperpixels.clear();
    this.lastSuperpixel = 0;
    this.annotation = undefined;

    this.setBlank();
  }

  onMouseDown(position: { x: number; y: number }) {
    if (this.annotationState === AnnotationStateType.Annotated) return;

    if (!this.currentMask) {
      this.currentMask = new ImageJS.Image(
        this.image.width,
        this.image.height,
        new Uint8Array(this.image.width * this.image.height * 4),
        { alpha: 1 }
      );
    }

    if (!this.superpixels) return;

    this.setAnnotating();
  }

  onMouseMove(position: { x: number; y: number }) {
    if (
      this.annotationState === AnnotationStateType.Annotated ||
      !this.superpixels ||
      !this.superpixelsMap
    )
      return;
    // fixes superpixel overflow
    position.x = position.x === 512 ? 511 : position.x;
    const pixel =
      Math.round(position.x) + Math.round(position.y) * this.image.width;

    const superpixel = this.superpixels[pixel];
    if (!superpixel || this.currentSuperpixels.has(superpixel)) return;

    this.lastSuperpixel = superpixel;

    if (this.annotationState !== AnnotationStateType.Annotating) {
      this.currentSuperpixels.clear();

      this.currentMask = new ImageJS.Image(
        this.image.width,
        this.image.height,
        new Uint8Array(this.image.width * this.image.height * 4),
        { alpha: 1 }
      );
    }

    this.currentSuperpixels.add(superpixel);

    this.superpixelsMap[superpixel].forEach((index: number) => {
      this.currentMask!.setPixel(index, [255, 0, 0, 150]);
    });
  }

  onMouseUp(position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationStateType.Annotating) return;

    if (!this.currentMask) return;

    const greyMask = this.currentMask.grey();
    //@ts-ignore
    const binaryMask = greyMask.mask({ algorithm: "threshold", threshold: 1 });

    //compute bounding box with ROI manager
    const roiManager = this.image.getRoiManager();
    // @ts-ignore
    roiManager.fromMask(binaryMask);
    // @ts-ignore
    const roi = roiManager.getRois()[0];
    this._boundingBox = [roi.minX, roi.minY, roi.maxX, roi.maxY];

    const width = this._boundingBox[2] - this._boundingBox[0];
    const height = this._boundingBox[3] - this._boundingBox[1];
    if (width <= 0 || height <= 0) {
      return;
    }

    const croppedGreyMask = greyMask.crop({
      x: this._boundingBox[0],
      y: this._boundingBox[1],
      width: width,
      height: height,
    });

    const thresholdMask = croppedGreyMask.data.map((i: number) =>
      i > 1 ? 255 : 0
    );

    this.maskData = Uint8Array.from(thresholdMask);
    this.setAnnotated();
  }
}
