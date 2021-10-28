import { AnnotationTool } from "../AnnotationTool";
import { doFlood, makeFloodMap } from "../../../flood";
import * as ImageJS from "image-js";
import { encode } from "../../../rle";
import PriorityQueue from "ts-priority-queue";

export class ColorAnnotationTool extends AnnotationTool {
  roiContour?: ImageJS.Image;
  roiMask?: ImageJS.Image;
  roiManager?: ImageJS.RoiManager;
  offset: { x: number; y: number } = { x: 0, y: 0 };
  overlayData: string = "";
  points: Array<number> = [];
  initialPosition: { x: number; y: number } = { x: 0, y: 0 };
  tolerance: number = 1;
  toleranceMap?: ImageJS.Image;
  floodMap?: ImageJS.Image;
  toleranceQueue: PriorityQueue<Array<number>> = new PriorityQueue({
    comparator: function (a: Array<number>, b: Array<number>) {
      return a[2] - b[2];
    },
  });
  toolTipPosition?: { x: number; y: number };
  maxTol: number = 0;
  seen: Set<number> = new Set();

  deselect() {
    this.annotated = false;
    this.annotating = false;

    this.overlayData = "";

    this.roiManager = undefined;
    this.roiMask = undefined;

    this.points = [];

    this.initialPosition = { x: 0, y: 0 };
    this.toolTipPosition = undefined;

    this.tolerance = 1;
    this.toleranceMap = undefined;
    this.toleranceQueue.clear();
    this.seen.clear();
    this.maxTol = 0;
  }

  onMouseDown(position: { x: number; y: number }) {
    this.annotated = false;
    this.annotating = true;
    this.tolerance = 1;
    this.maxTol = 0;
    this.initialPosition = position;
    this.toolTipPosition = position;

    this.toleranceMap = makeFloodMap({
      x: Math.floor(position.x),
      y: Math.floor(position.y),
      image: this.image!,
    });

    const empty = new Array(this.image.height * this.image.width).fill(
      Infinity
    );

    this.floodMap = new ImageJS.Image(
      this.image.width,
      this.image.height,
      empty,
      {
        alpha: 0,
        components: 1,
      }
    );

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
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.annotating) {
      const diff = Math.ceil(
        Math.hypot(
          position.x - this.initialPosition!.x,
          position.y - this.initialPosition!.y
        )
      );
      if (diff !== this.tolerance) {
        this.tolerance = diff;
        this.updateOverlay(this.initialPosition);
      }
      this.toolTipPosition = position;
    }
  }

  onMouseUp(position: { x: number; y: number }) {
    if (!this.roiManager || !this.roiMask) return;

    // @ts-ignore
    this.roiManager.fromMask(this.roiMask);
    // @ts-ignore
    this.roiMask = this.roiManager.getMasks()[0];

    //@ts-ignore
    const rois = this.roiManager.getRois();
    const roi = rois.sort((a: any, b: any) => {
      return b.surface - a.surface;
    })[1]; // take the second roi because the first one will be of the size of the image,the second one is the actual largest roi
    this._boundingBox = [roi.minX, roi.minY, roi.maxX + 1, roi.maxY + 1];

    if (!this.roiMask || !this.boundingBox) return;

    const boundingBoxWidth = this.boundingBox[2] - this.boundingBox[0];
    const boundingBoxHeight = this.boundingBox[3] - this.boundingBox[1];

    if (!boundingBoxWidth || !boundingBoxHeight) return;

    //mask should be the whole image, not just the ROI
    const imgMask = new ImageJS.Image(boundingBoxWidth, boundingBoxHeight, {
      components: 1,
      alpha: 0,
    });

    for (let x = 0; x < boundingBoxWidth; x++) {
      for (let y = 0; y < boundingBoxHeight; y++) {
        //@ts-ignore
        if (this.roiMask.getBitXY(x, y)) {
          imgMask.setPixelXY(x, y, [255]);
        }
      }
    }

    // @ts-ignore
    this._mask = encode(imgMask.data as Uint8Array);

    this.annotated = true;
    this.annotating = false;
  }

  private static colorOverlay(
    mask: ImageJS.Image,
    offset: { x: number; y: number },
    position: { x: number; y: number },
    width: number,
    height: number,
    color: string
  ) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const fillColor = [r, g, b, 150];

    let overlay = new ImageJS.Image(
      width,
      height,
      new Uint8Array(width * height * 4),
      { alpha: 1 }
    );

    // roiPaint doesn't respect alpha, so we'll paint it ourselves.
    for (let x = 0; x < mask.width; x++) {
      for (let y = 0; y < mask.height; y++) {
        if (mask.getBitXY(x, y)) {
          overlay.setPixelXY(x + offset.x, y + offset.y, fillColor);
        }
      }
    }

    // Set the origin point to white, for visibility.
    overlay.setPixelXY(position.x, position.y, [255, 255, 255, 255]);

    return overlay.toDataURL("image/png", { useCanvas: true });
  }

  private updateOverlay(position: { x: number; y: number }) {
    if (this.maxTol <= this.tolerance) {
      doFlood({
        floodMap: this.floodMap!,
        toleranceMap: this.toleranceMap!,
        queue: this.toleranceQueue,
        tolerance: this.tolerance,
        maxTol: this.maxTol,
        seen: this.seen,
      });
    }
    // Make a threshold mask
    this.roiMask = this.floodMap!.mask({
      threshold: this.tolerance,
      invert: true,
    });

    if (!this.roiMask) return;

    this.overlayData = ColorAnnotationTool.colorOverlay(
      this.roiMask,
      this.offset,
      position,
      this.image.width,
      this.image.height,
      "red"
    );
  }
}
