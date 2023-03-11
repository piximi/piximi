import * as ImageJS from "image-js";
import { v4 as uuidv4 } from "uuid";

import { Tool } from "../Tool";

import {
  AnnotationStateType,
  DecodedAnnotationType,
  Category,
  Point,
} from "types";

import { DataArray, convertToDataArray } from "utils/common/image";

import {
  computeBoundingBoxFromContours as _computeBoundingBoxFromContours,
  maskFromPoints as _maskFromPoints,
} from "utils/annotator";

export abstract class AnnotationTool extends Tool {
  /**
   * RoiManager of the annotated image.
   * https://image-js.github.io/image-js/#roi
   */
  manager: ImageJS.RoiManager;
  /**
   * Polygon that defines the annotation area, array of (x, y) coordinates.
   */
  points?: Array<Point> = [];
  /**
   * Coordinates of the annotation bounding box: [x1, y1, x2, y2].
   * Specifies the top left and bottom right points.
   */
  protected _boundingBox?: [number, number, number, number];
  /**
   * One-hot encoded mask of the annotation.
   */
  protected _mask?: Array<number>;
  /**
   * Raw msk data
   */
  protected _maskData?: DataArray;
  /**
   * State of the annotation: Blank (not yet annotating), Annotating or Annotated
   */
  annotationState = AnnotationStateType.Blank;
  /**
   * Annotation object of the Tool.
   */
  annotation?: DecodedAnnotationType;
  anchor?: Point = undefined;
  origin?: Point = undefined;
  buffer?: Array<Point> = [];

  onAnnotating?: () => void;
  onAnnotated?: () => void;
  onDeselect?: () => void;

  constructor(image: ImageJS.Image) {
    super(image);
    this.manager = image.getRoiManager();
  }

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
  computeBoundingBox(): [number, number, number, number] | undefined {
    if (!this.points || !this.points.length) return undefined;
    return [
      this.points[0].x,
      this.points[0].y,
      this.points[1].x,
      this.points[1].y,
    ];
  }

  setBoundingBoxFromContours(contour: Array<Point>) {
    this.boundingBox = _computeBoundingBoxFromContours(contour);
  }

  get mask(): Array<number> | undefined {
    return this._mask;
  }

  set mask(updatedMask: Array<number> | undefined) {
    this._mask = updatedMask;
  }

  get maskData(): DataArray | undefined {
    return this._maskData;
  }

  set maskData(updatedMask: DataArray | undefined) {
    this._maskData = updatedMask;
  }

  /**
   * Compute the mask image of the annotation polygon from the bounding box and the polygon points.
   */
  setAnnotationMaskFromPoints() {
    if (!this.boundingBox || !this.points) {
      return;
    }

    this.maskData = _maskFromPoints(
      this.points,
      { width: this.image.width, height: this.image.height },
      this.boundingBox
    );
  }

  setAnnotating() {
    this.annotationState = AnnotationStateType.Annotating;
    if (this.onAnnotating) {
      this.onAnnotating();
    }
  }
  registerOnAnnotatingHandler(handler: () => void): void {
    this.onAnnotating = handler;
  }

  setAnnotated() {
    this.annotationState = AnnotationStateType.Annotated;
    if (this.onAnnotated) {
      this.onAnnotated();
    }
  }
  registerOnAnnotatedHandler(handler: () => void): void {
    this.onAnnotated = handler;
  }

  setBlank() {
    this.annotationState = AnnotationStateType.Blank;
    if (this.onDeselect) {
      this.onDeselect();
    }
  }
  registerOnDeselectHandler(handler: () => void): void {
    this.onDeselect = handler;
  }

  abstract deselect(): void;

  abstract onMouseDown(position: { x: number; y: number }): void;

  abstract onMouseMove(position: { x: number; y: number }): void;

  abstract onMouseUp(position: { x: number; y: number }): void;

  /**
   * Creates and sets the annotation object.
   * @param category Category of the annotation.
   * @param plane Index of the image plane that corresponds to the annotation.
   * @returns
   */
  annotate(category: Category, plane: number): void {
    if (!this.boundingBox || !this.maskData) return;

    this.annotation = {
      boundingBox: this.boundingBox,
      categoryId: category.id,
      id: this.annotation ? this.annotation.id : uuidv4(),
      maskData: this.maskData,
      plane: plane,
    };
  }

  updateAnnotationMask(): void {
    if (!this.boundingBox || !this.maskData || !this.annotation) return;

    this.annotation = { ...this.annotation, maskData: this.maskData };
  }

  /**
   * Checks if a point lies within an annotation bounding box
   * @param x x-coord of point
   * @param y y-coord of point
   * @param boundingBox Bounding box of annotation
   * @returns true if point lies within the bounding box, false otherwise
   */
  isInBoundingBox(
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
   * @param newEncodedMaskData Encoded mask data of new annotation to be added
   * @param newBoundingBox Bounding box of new annotation to be added
   * @returns Bounding box and mask of the combined annotation areas
   */
  add(
    newEncodedMaskData: DataArray,
    newBoundingBox: [number, number, number, number]
  ): [Uint8Array, [number, number, number, number]] {
    if (!this._maskData || !this._boundingBox)
      return [convertToDataArray(8, []) as Uint8Array, [0, 0, 0, 0]];

    const newMaskData = newEncodedMaskData;
    const existingMaskData = this._maskData;
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
   * @returns Bounding box and mask of the intersected annotation areas.
   */
  intersect(
    decodedMask1: DataArray,
    boundingBox1: [number, number, number, number]
  ): [Uint8Array, [number, number, number, number]] {
    if (!this._maskData || !this._boundingBox)
      return [convertToDataArray(8, []) as Uint8Array, [0, 0, 0, 0]];

    const maskData1 = decodedMask1;
    const maskData2 = this._maskData;

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
        maskData1[b1i] === 255 &&
        this.isInBoundingBox(b2x, b2y, boundingBox2) &&
        maskData2[b2i] === 255
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
   * @returns Bounding box and mask of the inverted annotation area
   */
  invert(
    selectedMask: DataArray,
    selectedBoundingBox: [number, number, number, number]
  ): [Uint8Array, [number, number, number, number]] {
    const mask = selectedMask;

    const imageWidth = this.image.width;
    const imageHeight = this.image.height;

    // Find min and max boundary points when computing the mask.
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
        const x_mask = x - selectedBoundingBox[0];
        const y_mask = y - selectedBoundingBox[1];
        const value =
          mask[
            x_mask + y_mask * (selectedBoundingBox[2] - selectedBoundingBox[0])
          ];
        if (
          value > 0 &&
          this.isInBoundingBox(x_mask, y_mask, selectedBoundingBox)
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

    // Crop the mask using the new bounding box.
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
   * @returns Bounding box and mask of the difference of the annotation areas.
   */
  subtract(
    encodedMinuendData: DataArray,
    minuendBoundingBox: [number, number, number, number]
  ): [Uint8Array, [number, number, number, number]] {
    if (!this._maskData || !this._boundingBox)
      return [convertToDataArray(8, []) as Uint8Array, [0, 0, 0, 0]];

    // decode the selected annotation data
    const minuendData = encodedMinuendData;
    // decode the the subtrahend data
    const subtrahendData = this._maskData;

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
