import { encodeDataURL, fromMask, Image as IJSImage } from "image-js-latest";

import { slic } from "utils/image";

import { AnnotationTool } from "./AnnotationTool";
import { AnnotationState } from "../enums";

export class QuickAnnotationTool extends AnnotationTool {
  regionSize?: number;
  colorMasks?: Array<string>;
  currentSuperpixels: Set<number> = new Set<number>();
  lastSuperpixel: number = 0;
  superpixels?: Int32Array;
  superpixelsMap?: { [key: number]: Array<number> };
  currentMask?: IJSImage;
  map?: Uint8Array | Uint8ClampedArray;
  startAnnotating = false;
  throttleTimer: boolean = false;
  // Live preview raster (a cropped RGBA PNG data URL) + the region it covers, in
  // image coords. Recomputed on each new superpixel and read by QuickPreview —
  // mirrors ColorAnnotationTool's overlayData/overlayBoundingBox.
  overlayData: string = "";
  overlayBoundingBox?: [number, number, number, number];
  // Running pixel extent of the superpixels stamped into currentMask so far, so
  // we encode only the touched region instead of the whole image every move.
  private overlayMinX = Infinity;
  private overlayMinY = Infinity;
  private overlayMaxX = -Infinity;
  private overlayMaxY = -Infinity;

  _initializeSuperpixelse(regionSize: number) {
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
  }

  // throttled to prevent repeated expensive calls while resizing
  initializeSuperpixels(regionSize: number) {
    if (import.meta.env.NODE_ENV !== "test") {
      if (this.throttleTimer) return;
      this.throttleTimer = true;

      setTimeout(() => {
        this._initializeSuperpixelse(regionSize);
        this.throttleTimer = false;
      }, 500);
    } else {
      this._initializeSuperpixelse(regionSize);
    }
  }

  computeSuperpixels() {
    const data = this.image.getRawImage().data as Uint8Array;

    const { superpixels } = slic(
      data,
      this.image.width,
      this.image.height,
      this.regionSize,
    );

    return superpixels;
  }

  deselect() {
    this.colorMasks = undefined;
    this.currentSuperpixels.clear();
    this.lastSuperpixel = 0;
    this.currentMask = undefined;
    this.resetOverlay();

    this.setBlank();
  }

  private resetOverlay() {
    this.overlayData = "";
    this.overlayBoundingBox = undefined;
    this.overlayMinX = Infinity;
    this.overlayMinY = Infinity;
    this.overlayMaxX = -Infinity;
    this.overlayMaxY = -Infinity;
  }

  // Encode just the touched sub-region of currentMask (+ small padding) into
  // overlayData, positioned by overlayBoundingBox. Encoding a full-image PNG on
  // every move makes dragging laggy on large images, so we crop to the running
  // extent — same rationale as ColorAnnotationTool.updateOverlay.
  private updateOverlay() {
    if (
      !this.currentMask ||
      this.overlayMinX === Infinity ||
      this.overlayMaxX === -Infinity
    )
      return;

    const padding = 2;
    const x1 = Math.max(0, this.overlayMinX - padding);
    const y1 = Math.max(0, this.overlayMinY - padding);
    const x2 = Math.min(this.image.width, this.overlayMaxX + padding + 1);
    const y2 = Math.min(this.image.height, this.overlayMaxY + padding + 1);
    this.overlayBoundingBox = [x1, y1, x2, y2];

    const cropped = this.currentMask.crop({
      origin: { column: x1, row: y1 },
      width: x2 - x1,
      height: y2 - y1,
    });
    this.overlayData = encodeDataURL(cropped);
  }

  onMouseDown(_position: { x: number; y: number }) {
    if (this.annotationState === AnnotationState.Annotated) return;

    if (!this.currentMask) {
      this.currentMask = new IJSImage(
        this.image.width,
        this.image.height,

        {
          data: new Uint8Array(this.image.width * this.image.height * 4),
          colorModel: "RGBA",
        },
      );
      this.resetOverlay();
    }

    if (!this.superpixels) return;

    this.setAnnotating();
  }

  onMouseMove(position: { x: number; y: number }) {
    if (
      this.annotationState === AnnotationState.Annotated ||
      !this.superpixels ||
      !this.superpixelsMap
    )
      return;
    // fixes superpixel overflow
    position.x =
      position.x === this.image.width ? this.image.width - 1 : position.x;
    const pixel =
      Math.round(position.x) + Math.round(position.y) * this.image.width;

    const superpixel = this.superpixels[pixel];
    if (!superpixel || this.currentSuperpixels.has(superpixel)) return;

    this.lastSuperpixel = superpixel;

    if (this.annotationState !== AnnotationState.Annotating) {
      this.currentSuperpixels.clear();

      this.currentMask = new IJSImage(
        this.image.width,
        this.image.height,

        {
          data: new Uint8Array(this.image.width * this.image.height * 4),
          colorModel: "RGBA",
        },
      );
      this.resetOverlay();
    }

    this.currentSuperpixels.add(superpixel);

    this.superpixelsMap[superpixel].forEach((index: number) => {
      this.currentMask!.setPixelByIndex(index, [255, 0, 0, 150]);
      const x = index % this.image.width;
      const y = Math.floor(index / this.image.width);
      if (x < this.overlayMinX) this.overlayMinX = x;
      if (x > this.overlayMaxX) this.overlayMaxX = x;
      if (y < this.overlayMinY) this.overlayMinY = y;
      if (y > this.overlayMaxY) this.overlayMaxY = y;
    });

    this.updateOverlay();
  }

  onMouseUp(_position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationState.Annotating) return;

    if (!this.currentMask) {
      this.deselect();
      return;
    }
    const greyMask = this.currentMask.grey();
    // image-js-latest's threshold is a fraction of maxValue, so select any
    // non-zero-grey pixel (the stamped superpixels) — matching the `i > 1`
    // logic below. A literal `1` here would threshold at 100% of max and select
    // nothing, leaving no ROI to derive the bounding box from.
    const binaryMask = greyMask.threshold({
      threshold: 1 / greyMask.maxValue,
    });
    //compute bounding box with ROI manager
    const roiMap = fromMask(binaryMask);
    const roi = roiMap.getRois()[0];
    if (!roi) {
      this.deselect();
      return;
    }

    const minX = roi.origin.column;
    const minY = roi.origin.row;
    this._boundingBox = [minX, minY, minX + roi.width, minY + roi.height];

    const width = this._boundingBox[2] - this._boundingBox[0];
    const height = this._boundingBox[3] - this._boundingBox[1];
    if (width <= 0 || height <= 0) {
      this.deselect();
      return;
    }

    const croppedGreyMask = greyMask.crop({
      origin: { column: this._boundingBox[0], row: this._boundingBox[1] },
      width: width,
      height: height,
    });

    const thresholdMask = croppedGreyMask
      .getRawImage()
      .data.map((i: number) => (i > 1 ? 255 : 0));

    this.decodedMask = Uint8Array.from(thresholdMask);
    this.setAnnotated();
  }
}
