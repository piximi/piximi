import * as ImageJS from "image-js";

import { Tool } from "./Tool";

import {
  computeBoundingBoxFromContours as _computeBoundingBoxFromContours,
  maskFromPoints,
} from "utils/annotator";
import { convertToDataArray, generateUUID } from "utils/common/helpers";
import { Partition } from "utils/models/enums";
import { Point } from "../types";
import { AnnotationStateType } from "../enums";
import { DataArray } from "utils/file-io/types";
import { NewCategory, PartialDecodedAnnotationType } from "store/data/types";

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
  annotationState = AnnotationStateType.Blank;
  /**
   * Annotation object of the Tool.
   */
  annotation?: PartialDecodedAnnotationType;
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
    updatedBoundingBox: [number, number, number, number] | undefined
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
      this.boundingBox
    );
  }

  protected setAnnotating() {
    this.annotationState = AnnotationStateType.Annotating;
    if (this.onAnnotating) {
      this.onAnnotating();
    }
  }
  public registerOnAnnotatingHandler(handler: () => void): void {
    this.onAnnotating = handler;
  }

  protected setAnnotated() {
    this.annotationState = AnnotationStateType.Annotated;
    if (this.onAnnotated) {
      this.onAnnotated();
    }
  }
  public registerOnAnnotatedHandler(handler: () => void): void {
    this.onAnnotated = handler;
  }

  protected setBlank() {
    this.annotationState = AnnotationStateType.Blank;
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

  /**
   * Creates and sets the annotation object.
   * @param category Category of the annotation.
   * @param plane Index of the image plane that corresponds to the annotation.
   * @returns
   */
  public annotate(category: NewCategory, plane: number, imageId: string): void {
    if (!this.boundingBox || !this.decodedMask) return;

    this.annotation = {
      boundingBox: this.boundingBox,
      categoryId: category.id,
      id: this.annotation ? this.annotation.id : generateUUID(),
      imageId,
      decodedMask: this.decodedMask,
      activePlane: plane,
      partition: Partition.Unassigned,
    };
  }

  /**
   * Checks if a point lies within an annotation bounding box
   * @param x x-coord of point
   * @param y y-coord of point
   * @param boundingBox Bounding box of annotation
   * @returns true if point lies within the bounding box, false otherwise
   */
  private isInBoundingBox(
    x: number,
    y: number,
    boundingBox: [number, number, number, number]
  ) {
    if (x < 0 || y < 0) return false;
    if (x >= boundingBox[2] - boundingBox[0]) return false;
    if (y >= boundingBox[3] - boundingBox[1]) return false;
    return true;
  }

  /**
   * Add the areas selected by the current AnnotationTool from the selected annotation.
   * @param newEncodedMaskData Encoded encodedMask data of new annotation to be added
   * @param newBoundingBox Bounding box of new annotation to be added
   * @returns Bounding box and encodedMask of the combined annotation areas
   */
  public add(
    newEncodedMaskData: DataArray,
    newBoundingBox: [number, number, number, number]
  ): [Uint8Array, [number, number, number, number]] {
    if (!this._decodedMask || !this._boundingBox)
      return [convertToDataArray(8, []) as Uint8Array, [0, 0, 0, 0]];

    const newMaskData = newEncodedMaskData;
    const existingMaskData = this._decodedMask;
    const existingBoundingBox = this._boundingBox;

    const combinedBoundingBox = [
      existingBoundingBox[0] < newBoundingBox[0]
        ? existingBoundingBox[0]
        : newBoundingBox[0],
      existingBoundingBox[1] < newBoundingBox[1]
        ? existingBoundingBox[1]
        : newBoundingBox[1],
      existingBoundingBox[2] > newBoundingBox[2]
        ? existingBoundingBox[2]
        : newBoundingBox[2],
      existingBoundingBox[3] > newBoundingBox[3]
        ? existingBoundingBox[3]
        : newBoundingBox[3],
    ] as [number, number, number, number];

    const newBoundingBoxWidth = combinedBoundingBox[2] - combinedBoundingBox[0];
    const newBoundingBoxHeight =
      combinedBoundingBox[3] - combinedBoundingBox[1];

    const combinedMaskData = [];
    const deltaX1 = newBoundingBox[0] - combinedBoundingBox[0];
    const deltaY1 = newBoundingBox[1] - combinedBoundingBox[1];
    const deltaX2 = existingBoundingBox[0] - combinedBoundingBox[0];
    const deltaY2 = existingBoundingBox[1] - combinedBoundingBox[1];

    for (let i = 0; i < newBoundingBoxWidth * newBoundingBoxHeight; i++) {
      const x = i % newBoundingBoxWidth;
      const y = Math.floor(i / newBoundingBoxWidth);
      const b1x = x - deltaX1;
      const b1y = y - deltaY1;
      const b2x = x - deltaX2;
      const b2y = y - deltaY2;

      const b1i = b1x + b1y * (newBoundingBox[2] - newBoundingBox[0]);
      const b2i = b2x + b2y * (existingBoundingBox[2] - existingBoundingBox[0]);
      if (
        (this.isInBoundingBox(b1x, b1y, newBoundingBox) &&
          newMaskData[b1i] === 255) ||
        (this.isInBoundingBox(b2x, b2y, existingBoundingBox) &&
          existingMaskData[b2i] === 255)
      ) {
        combinedMaskData.push(255);
      } else {
        combinedMaskData.push(0);
      }
    }

    return [
      convertToDataArray(8, combinedMaskData) as Uint8Array,
      combinedBoundingBox,
    ];
  }

  /**
   * Intersect the areas selected by the current AnnotationTool and the selected annotation.
   * @param decodedMask1
   * @param boundingBox1
   * @returns Bounding box and encodedMask of the intersected annotation areas.
   */
  public intersect(
    decodedMask1: DataArray,
    boundingBox1: [number, number, number, number]
  ): [Uint8Array, [number, number, number, number]] {
    if (!this._decodedMask || !this._boundingBox)
      return [convertToDataArray(8, []) as Uint8Array, [0, 0, 0, 0]];

    const decodedMask2 = this._decodedMask;

    const boundingBox2 = this._boundingBox;

    const intersectionBoundingBox = [
      boundingBox2[0] > boundingBox1[0] ? boundingBox2[0] : boundingBox1[0],
      boundingBox2[1] > boundingBox1[1] ? boundingBox2[1] : boundingBox1[1],
      boundingBox2[2] < boundingBox1[2] ? boundingBox2[2] : boundingBox1[2],
      boundingBox2[3] < boundingBox1[3] ? boundingBox2[3] : boundingBox1[3],
    ] as [number, number, number, number];

    const intersectionBoundingBoxWidth =
      intersectionBoundingBox[2] - intersectionBoundingBox[0];
    const intersectionBoundingBoxHeight =
      intersectionBoundingBox[3] - intersectionBoundingBox[1];

    // Check if bounding box is valid: width and height of the intersection must be positive.
    if (intersectionBoundingBoxWidth < 0 || intersectionBoundingBoxHeight < 0) {
      return [convertToDataArray(8, []) as Uint8Array, [0, 0, 0, 0]];
    }

    const newMaskData = [];
    const deltaX1 = boundingBox1[0] - intersectionBoundingBox[0];
    const deltaY1 = boundingBox1[1] - intersectionBoundingBox[1];
    const deltaX2 = boundingBox2[0] - intersectionBoundingBox[0];
    const deltaY2 = boundingBox2[1] - intersectionBoundingBox[1];

    for (
      let i = 0;
      i < intersectionBoundingBoxWidth * intersectionBoundingBoxHeight;
      i++
    ) {
      const x = i % intersectionBoundingBoxWidth;
      const y = Math.floor(i / intersectionBoundingBoxWidth);
      const b1x = x - deltaX1;
      const b1y = y - deltaY1;
      const b2x = x - deltaX2;
      const b2y = y - deltaY2;

      const b1i = b1x + b1y * (boundingBox1[2] - boundingBox1[0]);
      const b2i = b2x + b2y * (boundingBox2[2] - boundingBox2[0]);
      if (
        this.isInBoundingBox(b1x, b1y, boundingBox1) &&
        decodedMask1[b1i] === 255 &&
        this.isInBoundingBox(b2x, b2y, boundingBox2) &&
        decodedMask2[b2i] === 255
      ) {
        newMaskData.push(255);
      } else {
        newMaskData.push(0);
      }
    }

    if (!newMaskData.length)
      return [convertToDataArray(8, []) as Uint8Array, [0, 0, 0, 0]];

    return [
      convertToDataArray(8, newMaskData) as Uint8Array,
      intersectionBoundingBox,
    ];
  }

  /**
   * Invert the selected annotation area
   * @param selectedMask
   * @param selectedBoundingBox
   * @returns Bounding box and encodedMask of the inverted annotation area
   */
  public invert(
    selectedMask: DataArray,
    selectedBoundingBox: [number, number, number, number]
  ): [Uint8Array, [number, number, number, number]] {
    const encodedMask = selectedMask;

    const imageWidth = this.image.width;
    const imageHeight = this.image.height;

    // Find min and max boundary points when computing the encodedMask.
    const invertedBoundingBox: [number, number, number, number] = [
      imageWidth,
      imageHeight,
      0,
      0,
    ];

    const invertedMask = new ImageJS.Image(imageWidth, imageHeight, {
      components: 1,
      alpha: 0,
    });
    for (let x = 0; x < imageWidth; x++) {
      for (let y = 0; y < imageHeight; y++) {
        const x_encodedMask = x - selectedBoundingBox[0];
        const y_encodedMask = y - selectedBoundingBox[1];
        const value =
          encodedMask[
            x_encodedMask +
              y_encodedMask * (selectedBoundingBox[2] - selectedBoundingBox[0])
          ];
        if (
          value > 0 &&
          this.isInBoundingBox(
            x_encodedMask,
            y_encodedMask,
            selectedBoundingBox
          )
        ) {
          invertedMask.setPixelXY(x, y, [0]);
        } else {
          invertedMask.setPixelXY(x, y, [255]);
          if (x < invertedBoundingBox[0]) {
            invertedBoundingBox[0] = x;
          } else if (x > invertedBoundingBox[2]) {
            invertedBoundingBox[2] = x + 1;
          }
          if (y < invertedBoundingBox[1]) {
            invertedBoundingBox[1] = y;
          } else if (y > invertedBoundingBox[3]) {
            invertedBoundingBox[3] = y + 1;
          }
        }
      }
    }

    // Crop the encodedMask using the new bounding box.
    const croppedInvertedMask = invertedMask.crop({
      x: invertedBoundingBox[0],
      y: invertedBoundingBox[1],
      width: invertedBoundingBox[2] - invertedBoundingBox[0],
      height: invertedBoundingBox[3] - invertedBoundingBox[1],
    });

    return [
      convertToDataArray(8, croppedInvertedMask.data) as Uint8Array,
      invertedBoundingBox,
    ];
  }

  /**
   * Subtract the areas selected by the current AnnotationTool (subtrahend) from the selected annotation (minuend).
   * [Difference = Minuend - Subtrahend]
   * @param encodedMinuendData
   * @param minuendBoundingBox
   * @returns Bounding box and encodedMask of the difference of the annotation areas.
   */
  public subtract(
    encodedMinuendData: DataArray,
    minuendBoundingBox: [number, number, number, number]
  ): [Uint8Array, [number, number, number, number]] {
    if (!this._decodedMask || !this._boundingBox)
      return [convertToDataArray(8, []) as Uint8Array, [0, 0, 0, 0]];

    // decode the selected annotation data
    const minuendData = encodedMinuendData;
    // decode the the subtrahend data
    const subtrahendData = this._decodedMask;

    const subtrahendBoundingBox = this._boundingBox;

    const resultingBoundingBox = [
      subtrahendBoundingBox[2] > minuendBoundingBox[0] &&
      subtrahendBoundingBox[0] < minuendBoundingBox[0] &&
      subtrahendBoundingBox[1] < minuendBoundingBox[1] &&
      subtrahendBoundingBox[3] > minuendBoundingBox[3]
        ? subtrahendBoundingBox[2]
        : minuendBoundingBox[0],
      subtrahendBoundingBox[3] > minuendBoundingBox[1] &&
      subtrahendBoundingBox[1] < minuendBoundingBox[1] &&
      subtrahendBoundingBox[0] < minuendBoundingBox[0] &&
      subtrahendBoundingBox[2] > minuendBoundingBox[2]
        ? subtrahendBoundingBox[3]
        : minuendBoundingBox[1],
      subtrahendBoundingBox[0] < minuendBoundingBox[2] &&
      subtrahendBoundingBox[2] > minuendBoundingBox[2] &&
      subtrahendBoundingBox[1] < minuendBoundingBox[1] &&
      subtrahendBoundingBox[3] > minuendBoundingBox[3]
        ? subtrahendBoundingBox[0]
        : minuendBoundingBox[2],
      subtrahendBoundingBox[1] < minuendBoundingBox[3] &&
      subtrahendBoundingBox[3] > minuendBoundingBox[3] &&
      subtrahendBoundingBox[0] < minuendBoundingBox[0] &&
      subtrahendBoundingBox[2] > minuendBoundingBox[2]
        ? subtrahendBoundingBox[1]
        : minuendBoundingBox[3],
    ] as [number, number, number, number];

    const resultingBoundingBoxWidth =
      resultingBoundingBox[2] - resultingBoundingBox[0];
    const resultingBoundingBoxHeight =
      resultingBoundingBox[3] - resultingBoundingBox[1];

    // Check if bounding box is valid: width and height of the intersection must be positive.
    if (resultingBoundingBoxWidth < 0 || resultingBoundingBoxHeight < 0) {
      return [convertToDataArray(8, []) as Uint8Array, [0, 0, 0, 0]];
    }

    const resultingMaskData: number[] = [];
    const deltaX1 = minuendBoundingBox[0] - resultingBoundingBox[0];
    const deltaY1 = minuendBoundingBox[1] - resultingBoundingBox[1];
    const deltaX2 = subtrahendBoundingBox[0] - resultingBoundingBox[0];
    const deltaY2 = subtrahendBoundingBox[1] - resultingBoundingBox[1];

    for (
      let i = 0;
      i < resultingBoundingBoxWidth * resultingBoundingBoxHeight;
      i++
    ) {
      const x = i % resultingBoundingBoxWidth;
      const y = Math.floor(i / resultingBoundingBoxWidth);
      const b1x = x - deltaX1;
      const b1y = y - deltaY1;
      const b2x = x - deltaX2;
      const b2y = y - deltaY2;

      const b1i = b1x + b1y * (minuendBoundingBox[2] - minuendBoundingBox[0]);
      const b2i =
        b2x + b2y * (subtrahendBoundingBox[2] - subtrahendBoundingBox[0]);
      if (
        this.isInBoundingBox(b1x, b1y, minuendBoundingBox) &&
        minuendData[b1i] === 255 &&
        this.isInBoundingBox(b2x, b2y, subtrahendBoundingBox) &&
        subtrahendData[b2i] === 255
      ) {
        resultingMaskData.push(0);
      } else {
        resultingMaskData.push(minuendData[b1i]);
      }
    }

    return [
      convertToDataArray(8, resultingMaskData) as Uint8Array,
      resultingBoundingBox,
    ];
  }
}
