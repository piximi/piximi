import IJSImage, { RoiManager as IJSRoiManager } from "image-js";
import PriorityQueue from "ts-priority-queue";

import { AnnotationTool } from "./AnnotationTool";
import { Point } from "utils/types";
import { AnnotationState } from "../enums";

export class ColorAnnotationTool extends AnnotationTool {
  roiContour?: IJSImage;
  roiMask?: IJSImage;
  roiManager?: IJSRoiManager;
  offset: { x: number; y: number } = { x: 0, y: 0 };
  overlayData: string = "";
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

  deselect() {
    this.overlayData = "";
    this.roiManager = undefined;
    this.roiMask = undefined;
    this.points = [];
    this.origin = { x: 0, y: 0 };
    this.toolTipPosition = undefined;
    this.tolerance = 1;
    this.toleranceMap = undefined;
    this.toleranceQueue.clear();
    this.seen.clear();
    this.annotation = undefined;
    this.setBlank();
  }

  onMouseDown(position: { x: number; y: number }) {
    this.origin = position;
    this.toolTipPosition = position;

    this.toleranceMap = this.createToleranceMap({
      x: Math.floor(position.x),
      y: Math.floor(position.y),
      image: this.image,
    });

    const empty = new Array(this.image.height * this.image.width).fill(
      Infinity,
    );

    this.floodMap = new IJSImage(this.image.width, this.image.height, empty, {
      alpha: 0,
      components: 1,
    });

    this.toleranceQueue.clear();
    this.seen.clear();
    this.roiManager = this.floodMap.getRoiManager();

    this.toleranceQueue.queue([
      Math.floor(position.x),
      Math.floor(position.y),
      0,
    ]);

    const idx =
      Math.floor(position.x) + Math.floor(position.y) * this.image.width;

    this.seen.add(idx);
    this.updateOverlay(position);
    this.setAnnotating();
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotationState === AnnotationState.Annotating) {
      const diff = Math.ceil(
        Math.hypot(position.x - this.origin!.x, position.y - this.origin!.y),
      );
      if (diff !== this.tolerance) {
        this.tolerance = diff;
        this.updateOverlay(this.origin);
      }
      this.toolTipPosition = position;
    }
  }

  onMouseUp(_position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationState.Annotating) return;
    if (!this.roiManager || !this.roiMask) return;

    // @ts-ignore it does exist
    this.roiManager.fromMask(this.roiMask);
    // @ts-ignore it does exist
    this.roiMask = this.roiManager.getMasks()[0];
    //@ts-ignore it does exist
    const roi = this.roiManager.getRois()[0];

    this._boundingBox = [roi.minX, roi.minY, roi.maxX + 1, roi.maxY + 1];

    if (!this.roiMask || !this.boundingBox) return;

    const boundingBoxWidth = this.boundingBox[2] - this.boundingBox[0];
    const boundingBoxHeight = this.boundingBox[3] - this.boundingBox[1];

    if (!boundingBoxWidth || !boundingBoxHeight) return;

    //mask should be the whole image, not just the ROI
    const imgMask = new IJSImage(boundingBoxWidth, boundingBoxHeight, {
      components: 1,
      alpha: 0,
    });

    for (let x = 0; x < boundingBoxWidth; x++) {
      for (let y = 0; y < boundingBoxHeight; y++) {
        if (this.roiMask.getBitXY(x, y)) {
          imgMask.setPixelXY(x, y, [255]);
        }
      }
    }

    this.decodedMask = imgMask.data as Uint8Array;

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

    const color = image.getPixelXY(x, y);

    if (image.data.length === image.width * image.height * 3) {
      //RGB image
      for (let i = 0; i < image.data.length; i += 3) {
        const red = Math.abs(image.data[i] - color[0]);
        const green = Math.abs(image.data[i + 1] - color[1]);
        const blue = Math.abs(image.data[i + 2] - color[2]);
        tol.push(Math.floor((red + green + blue) / 3));
      }
    } else if (image.data.length === image.width * image.height * 4) {
      //RGBA image
      for (let i = 0; i < image.data.length; i += 4) {
        const red = Math.abs(image.data[i] - color[0]);
        const green = Math.abs(image.data[i + 1] - color[1]);
        const blue = Math.abs(image.data[i + 2] - color[2]);
        tol.push(Math.floor((red + green + blue) / 3));
      }
    } else if (image.data.length === image.width * image.height) {
      //greyscale
      for (let i = 0; i < image.data.length; i++) {
        const grey = Math.abs(image.data[i] - color[0]);
        tol.push(Math.floor((grey / image.maxValue) * 255));
      }
    }

    return new IJSImage(image.width, image.height, tol, {
      alpha: 0,
      components: 1,
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
      floodMap.setPixelXY(currentPoint[0], currentPoint[1], [maxTol]);
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
          queue.queue([newX, newY, toleranceMap.getPixelXY(newX, newY)[0]]);
          seen.add(idx);
        }
      }
    }
  };

  private updateOverlay(position: { x: number; y: number }) {
    this.createFloodMap(
      this.floodMap!,
      this.toleranceMap!,
      this.toleranceQueue,
      this.tolerance,
      0,
      this.seen,
    );
    // Make a threshold mask
    this.roiMask = this.floodMap!.mask({
      threshold: this.tolerance,
      invert: true,
    });

    if (!this.roiMask) return;

    this.overlayData = this.colorOverlay(
      this.roiMask,
      this.offset,
      position,
      this.image.width,
      this.image.height,
    );
  }

  private colorOverlay(
    mask: IJSImage,
    offset: { x: number; y: number },
    position: { x: number; y: number },
    width: number,
    height: number,
  ) {
    const overlay = new IJSImage(
      width,
      height,
      new Uint8Array(width * height * 4),
      { alpha: 1 },
    );

    // roiPaint doesn't respect alpha, so we'll paint it ourselves.
    for (let x = 0; x < mask.width; x++) {
      for (let y = 0; y < mask.height; y++) {
        if (mask.getBitXY(x, y)) {
          overlay.setPixelXY(x + offset.x, y + offset.y, [237, 0, 0, 150]);
        }
      }
    }

    // Set the origin point to white, for visibility.
    overlay.setPixelXY(position.x, position.y, [255, 255, 255, 255]);

    return overlay.toDataURL("image/png", { useCanvas: true });
  }
}
