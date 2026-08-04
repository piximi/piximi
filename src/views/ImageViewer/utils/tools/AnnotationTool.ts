import {
  computeBoundingBoxFromContours as _computeBoundingBoxFromContours,
  maskFromPoints,
} from "views/ImageViewer/utils";
import type { DataArray } from "store/dataV2/types";

import type { Point } from "utils/types";

import { AnnotationState } from "../enums";
import { Tool } from "./Tool";

export abstract class AnnotationTool extends Tool {
  /**
   * Polygon that defines the annotation area, array of (x, y) coordinates.
   */
  points: Array<Point> = [];
  /**
   * Coordinates of the annotation bounding box: [x1, y1, x2, y2].
   * Specifies the top left and bottom right points.
   */
  protected _boundingBox?: [number, number, number, number];
  /**
   * One-hot encoded encodedMask of the annotation.
   */
  protected _encodedMask?: Array<number>;
  /**
   * Raw msk data
   */
  protected _decodedMask?: DataArray;
  /**
   * State of the annotation: Blank (not yet annotating), Annotating or Annotated
   */
  annotationState = AnnotationState.Blank;
  /**
   * Annotation object of the Tool.
   */
  anchor?: Point = undefined;
  origin?: Point = undefined;
  buffer?: Array<Point> = [];

  onAnnotating?: () => void;
  onAnnotated?: () => void;
  onDeselect?: () => void;

  get boundingBox(): [number, number, number, number] | undefined {
    return this._boundingBox;
  }

  set boundingBox(
    updatedBoundingBox: [number, number, number, number] | undefined,
  ) {
    this._boundingBox = updatedBoundingBox;
  }

  /**
   * Compute the bounding box of the polygon that defined the annotation.
   * @returns bounding box [number, number, number, number] or undefined
   */
  protected computeBoundingBox(): [number, number, number, number] | undefined {
    if (this.points.length === 0) return undefined;
    return [
      this.points[0].x,
      this.points[0].y,
      this.points[1].x,
      this.points[1].y,
    ];
  }

  protected setBoundingBoxFromContours(contour: Array<Point>) {
    this.boundingBox = _computeBoundingBoxFromContours(contour);
  }

  get encodedMask(): Array<number> | undefined {
    return this._encodedMask;
  }

  set encodedMask(updatedMask: Array<number> | undefined) {
    this._encodedMask = updatedMask;
  }

  get decodedMask(): DataArray | undefined {
    return this._decodedMask;
  }

  set decodedMask(updatedMask: DataArray | undefined) {
    this._decodedMask = updatedMask;
  }

  /**
   * Compute the encodedMask image of the annotation polygon from the bounding box and the polygon points.
   */
  protected setAnnotationMaskFromPoints() {
    if (!this.boundingBox || this.points.length === 0) {
      return;
    }

    this.decodedMask = maskFromPoints(
      this.points,
      { width: this.image.width, height: this.image.height },
      this.boundingBox,
    );
  }

  protected setAnnotating() {
    this.annotationState = AnnotationState.Annotating;
    if (this.onAnnotating) {
      this.onAnnotating();
    }
  }
  public registerOnAnnotatingHandler(handler: () => void): void {
    this.onAnnotating = handler;
  }

  protected setAnnotated() {
    this.annotationState = AnnotationState.Annotated;
    if (this.onAnnotated) {
      this.onAnnotated();
    }
  }
  public registerOnAnnotatedHandler(handler: () => void): void {
    this.onAnnotated = handler;
  }

  protected setBlank() {
    this.annotationState = AnnotationState.Blank;
    if (this.onDeselect) {
      this.onDeselect();
    }
  }
  public registerOnDeselectHandler(handler: () => void): void {
    this.onDeselect = handler;
  }

  public abstract deselect(): void;

  public abstract onMouseDown(position: { x: number; y: number }): void;

  public abstract onMouseMove(position: { x: number; y: number }): void;

  public abstract onMouseUp(position: { x: number; y: number }): void;
}
