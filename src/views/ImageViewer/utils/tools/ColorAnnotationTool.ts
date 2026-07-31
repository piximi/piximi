import { encodeDataURL, fromMask, Image as IJSImage } from "image-js-latest";
import PriorityQueue from "ts-priority-queue";

import type { Point } from "utils/types";

import { AnnotationTool } from "./AnnotationTool";
import { AnnotationState } from "../enums";

import type { Mask, RoiMapManager } from "image-js-latest";

export class ColorAnnotationTool extends AnnotationTool {
  roiContour?: IJSImage;
  roiMask?: Mask;
  roiManager?: RoiMapManager;
  offset: { x: number; y: number } = { x: 0, y: 0 };
  overlayData: string = "";
  // The region overlayData is rasterized/positioned at — just the extent the
  // flood has actually reached (+ padding), not the whole image. Read by
  // ColorPreview to position the <image> element.
  overlayBoundingBox?: [number, number, number, number];
  points: Array<Point> = [];
  origin: { x: number; y: number } = { x: 0, y: 0 };
  tolerance: number = 1;
  toleranceMap?: IJSImage;
  floodMap?: IJSImage;
  toleranceQueue: PriorityQueue<Array<number>> = new PriorityQueue({
    comparator: function (a: Array<number>, b: Array<number>) {
      return a[2] - b[2];
    },
  });
  toolTipPosition?: { x: number; y: number };
  seen: Set<number> = new Set();

  // Running (unpadded) pixel extent of everything the flood has stamped into
  // floodMap so far, updated incrementally in createFloodMap. Used to crop the
  // overlay raster instead of rebuilding/encoding the whole image every time.
  private floodMinX = 0;
  private floodMinY = 0;
  private floodMaxX = 0;
  private floodMaxY = 0;

  deselect() {
    this.overlayData = "";
    this.overlayBoundingBox = undefined;
    this.roiManager = undefined;
    this.roiMask = undefined;
    this.points = [];
    this.origin = { x: 0, y: 0 };
    this.toolTipPosition = undefined;
    this.tolerance = 1;
    this.toleranceMap = undefined;
    this.toleranceQueue.clear();
    this.seen.clear();
    this.setBlank();
  }

  onMouseDown(position: { x: number; y: number }) {
    this.origin = position;
    this.toolTipPosition = position;

    const seedX = Math.floor(position.x);
    const seedY = Math.floor(position.y);
    this.floodMinX = seedX;
    this.floodMinY = seedY;
    this.floodMaxX = seedX;
    this.floodMaxY = seedY;

    this.toleranceMap = this.createToleranceMap({
      x: seedX,
      y: seedY,
      image: this.image,
    });

    // Sentinel for "not yet reached by the flood": real per-pixel costs from
    // createToleranceMap are always in [0, 255], so the max value a 16-bit
    // channel can hold is comfortably larger than any real cost or drag
    // distance used as `tolerance`. (A plain `Infinity` can't be stored here —
    // typed arrays coerce non-finite values to 0, which would be indistinguishable
    // from an actually-reached, zero-cost pixel.)
    const empty = new Array(this.image.height * this.image.width).fill(65535);

    this.floodMap = new IJSImage(this.image.width, this.image.height, {
      data: new Uint16Array(empty),
      colorModel: "GREY",
      bitDepth: 16,
    });

    this.toleranceQueue.clear();
    this.seen.clear();

    this.toleranceQueue.queue([seedX, seedY, 0]);

    const idx = seedX + seedY * this.image.width;

    this.seen.add(idx);
    this.updateOverlay();
    this.setAnnotating();
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotationState === AnnotationState.Annotating) {
      const diff = Math.ceil(
        Math.hypot(position.x - this.origin!.x, position.y - this.origin!.y),
      );
      if (diff !== this.tolerance) {
        this.tolerance = diff;
        this.updateOverlay();
      }
      this.toolTipPosition = position;
    }
  }

  onMouseUp(_position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationState.Annotating) return;
    if (!this.roiMask) return;

    this.roiManager = fromMask(this.roiMask);
    const roi = this.roiManager.getRois()[0];
    this.roiMask = roi.getMask();

    this._boundingBox = [
      roi.origin.column,
      roi.origin.row,
      roi.origin.column + roi.width,
      roi.origin.row + roi.height,
    ];

    if (!this.roiMask || !this.boundingBox) return;

    const boundingBoxWidth = this.boundingBox[2] - this.boundingBox[0];
    const boundingBoxHeight = this.boundingBox[3] - this.boundingBox[1];

    if (!boundingBoxWidth || !boundingBoxHeight) return;

    //mask should be the whole image, not just the ROI
    const imgMask = new IJSImage(boundingBoxWidth, boundingBoxHeight, {
      colorModel: "GREY",
    });

    for (let x = 0; x < boundingBoxWidth; x++) {
      for (let y = 0; y < boundingBoxHeight; y++) {
        if (this.roiMask.getBit(x, y)) {
          imgMask.setPixel(x, y, [255]);
        }
      }
    }

    this.decodedMask = imgMask.getRawImage().data as Uint8Array;

    this.setAnnotated();
  }

  private createToleranceMap = ({
    x,
    y,
    image,
  }: {
    x: number;
    y: number;
    image: IJSImage;
  }) => {
    const tol: Array<number> = [];

    const color = image.getPixel(x, y);
    const data = image.getRawImage().data;

    if (data.length === image.width * image.height * 3) {
      //RGB image
      for (let i = 0; i < data.length; i += 3) {
        const red = Math.abs(data[i] - color[0]);
        const green = Math.abs(data[i + 1] - color[1]);
        const blue = Math.abs(data[i + 2] - color[2]);
        tol.push(Math.floor((red + green + blue) / 3));
      }
    } else if (data.length === image.width * image.height * 4) {
      //RGBA image
      for (let i = 0; i < data.length; i += 4) {
        const red = Math.abs(data[i] - color[0]);
        const green = Math.abs(data[i + 1] - color[1]);
        const blue = Math.abs(data[i + 2] - color[2]);
        tol.push(Math.floor((red + green + blue) / 3));
      }
    } else if (data.length === image.width * image.height) {
      //greyscale
      for (let i = 0; i < data.length; i++) {
        const grey = Math.abs(data[i] - color[0]);
        tol.push(Math.floor((grey / image.maxValue) * 255));
      }
    }

    return new IJSImage(image.width, image.height, {
      data: new Uint8Array(tol),
      colorModel: "GREY",
    });
  };

  // Expand a watershed map until the desired tolerance is reached.
  private createFloodMap = (
    floodMap: IJSImage,
    toleranceMap: IJSImage,
    queue: PriorityQueue<Array<number>>,
    tolerance: number,
    maxTol: number,
    seen: Set<number>,
  ) => {
    const dirs = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];
    while (queue.length > 0 && queue.peek()[2] <= tolerance) {
      const currentPoint = queue.dequeue();
      maxTol = Math.max(currentPoint[2], maxTol);
      floodMap.setPixel(currentPoint[0], currentPoint[1], [maxTol]);

      if (currentPoint[0] < this.floodMinX) this.floodMinX = currentPoint[0];
      else if (currentPoint[0] > this.floodMaxX)
        this.floodMaxX = currentPoint[0];
      if (currentPoint[1] < this.floodMinY) this.floodMinY = currentPoint[1];
      else if (currentPoint[1] > this.floodMaxY)
        this.floodMaxY = currentPoint[1];

      for (const dir of dirs) {
        const newX = currentPoint[0] + dir[0];
        const newY = currentPoint[1] + dir[1];
        const idx = newX + newY * toleranceMap.width;
        if (
          !seen.has(idx) &&
          newX >= 0 &&
          newY >= 0 &&
          newX < toleranceMap.width &&
          newY < toleranceMap.height
        ) {
          queue.queue([newX, newY, toleranceMap.getPixel(newX, newY)[0]]);
          seen.add(idx);
        }
      }
    }
  };

  private updateOverlay() {
    this.createFloodMap(
      this.floodMap!,
      this.toleranceMap!,
      this.toleranceQueue,
      this.tolerance,
      0,
      this.seen,
    );
    // Make a threshold mask
    this.roiMask = this.floodMap!.threshold({
      threshold: Math.min(1, this.tolerance / this.floodMap!.maxValue),
    }).invert();

    if (!this.roiMask) return;

    // Rasterize/encode only the region the flood has actually reached (+ a
    // small margin), not the whole image. Encoding a full-image PNG on every
    // mousemove makes dragging laggy — see docs/implementation/
    // color-annotation-tool-migration.md for measurements.
    const padding = 2;
    const x1 = Math.max(0, this.floodMinX - padding);
    const y1 = Math.max(0, this.floodMinY - padding);
    const x2 = Math.min(this.image.width, this.floodMaxX + padding + 1);
    const y2 = Math.min(this.image.height, this.floodMaxY + padding + 1);
    this.overlayBoundingBox = [x1, y1, x2, y2];

    this.overlayData = this.colorOverlay(
      this.roiMask,
      this.offset,
      this.overlayBoundingBox,
    );
  }

  private colorOverlay(
    mask: Mask,
    offset: { x: number; y: number },
    region: [number, number, number, number],
  ) {
    const [x1, y1, x2, y2] = region;
    const width = x2 - x1;
    const height = y2 - y1;

    const overlay = new IJSImage(width, height, {
      data: new Uint8Array(width * height * 4),
      colorModel: "RGBA",
    });

    // roiPaint doesn't respect alpha, so we'll paint it ourselves.
    for (let x = x1; x < x2; x++) {
      for (let y = y1; y < y2; y++) {
        if (mask.getBit(x, y)) {
          overlay.setPixel(
            x - x1 + offset.x,
            y - y1 + offset.y,
            [237, 0, 0, 150],
          );
        }
      }
    }

    // Set the origin point to white, for visibility.
    overlay.setPixel(
      this.origin.x - x1 + offset.x,
      this.origin.y - y1 + offset.y,
      [255, 255, 255, 255],
    );

    return encodeDataURL(overlay);
  }
}
