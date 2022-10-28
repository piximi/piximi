import * as ImageJS from "image-js";
import { min, max } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { scanline, simplifyPolygon } from "utils/annotator";
import { Tool } from "../../Tool/Tool";
import { connectPoints } from "utils/common/imageHelper";

import {
  AnnotationStateType,
  decodedAnnotationType,
  Category,
  Point,
} from "types";

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
  protected _maskData?: Uint8Array;
  /**
   * State of the annotation: Blank (not yet annotating), Annotating or Annotated
   */
  annotationState = AnnotationStateType.Blank;
  /**
   * Annotation object of the Tool.
   */
  annotation?: decodedAnnotationType;
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

  computeBoundingBoxFromContours(
    contour: Array<Point>
  ): [number, number, number, number] {
    const xValues = contour.map((point) => point.x);
    const yValues = contour.map((point) => point.y);
    return [
      Math.round(min(xValues)!),
      Math.round(min(yValues)!),
      Math.round(max(xValues)!),
      Math.round(max(yValues)!),
    ];
  }

  get mask(): Array<number> | undefined {
    return this._mask;
  }

  set mask(updatedMask: Array<number> | undefined) {
    this._mask = updatedMask;
  }

  get maskData(): Uint8Array | undefined {
    return this._maskData;
  }

  set maskData(updatedMask: Uint8Array | undefined) {
    this._maskData = updatedMask;
  }

  /**
   * Compute the mask image of the annotation polygon from the bounding box and the polygon points.
   * @returns Mask image of the annotation.
   */
  computeAnnotationMaskFromPoints() {
    const boundingBox = this.boundingBox;
    if (!boundingBox) return undefined;

    const width = boundingBox[2] - boundingBox[0];
    const height = boundingBox[3] - boundingBox[1];
    if (width <= 0 || height <= 0) {
      return undefined;
    }

    const coordinates = this.points;

    const connectedPoints = connectPoints(coordinates!); // get coordinates of connected points and draw boundaries of mask

    const simplifiedPoints = simplifyPolygon(connectedPoints);

    const maskImage = scanline(
      simplifiedPoints,
      this.image.width,
      this.image.height
    );

    // @ts-ignore: getChannel API is not exposed
    const greyScaleMask = maskImage.getChannel(0); // as ImageJS.Image;

    return greyScaleMask.crop({
      x: boundingBox[0],
      y: boundingBox[1],
      width: width,
      height: height,
    });
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

  /*
   * Method for add, subtract and intersect modes.
   * Draw a ROI mask in the coordinate space of the new combined bounding box.
   * */
  // drawMaskInNewBoundingBox(
  //   newMaskImage: ImageJS.Image,
  //   maskImage: ImageJS.Image,
  //   boundingBox: [number, number, number, number],
  //   newBoundingBox: [number, number, number, number]
  // ) {
  //   for (let x = 0; x < maskImage.width; x++) {
  //     for (let y = 0; y < maskImage.height; y++) {
  //       const pixel = maskImage.getPixelXY(x, y)[0];
  //       if (pixel === 255) {
  //         newMaskImage.setPixelXY(
  //           x + boundingBox[0] - newBoundingBox[0],
  //           y + boundingBox[1] - newBoundingBox[1],
  //           [255]
  //         );
  //       }
  //     }
  //   }
  //   return newMaskImage;
  // }

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
    newEncodedMaskData: Uint8Array,
    newBoundingBox: [number, number, number, number]
  ): [Uint8Array, [number, number, number, number]] {
    if (!this._maskData || !this._boundingBox)
      return [Uint8Array.from([]), [0, 0, 0, 0]];

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

    return [Uint8Array.from(combinedMaskData), combinedBoundingBox];
  }

  /**
   * Intersect the areas selected by the current AnnotationTool and the selected annotation.
   * @param decodedMask1
   * @param boundingBox1
   * @returns Bounding box and mask of the intersected annotation areas.
   */
  intersect(
    decodedMask1: Uint8Array,
    boundingBox1: [number, number, number, number]
  ): [Uint8Array, [number, number, number, number]] {
    if (!this._maskData || !this._boundingBox)
      return [Uint8Array.from([]), [0, 0, 0, 0]];

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
      return [Uint8Array.from([]), [0, 0, 0, 0]];
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

    if (!newMaskData.length) return [Uint8Array.from([]), [0, 0, 0, 0]];

    return [Uint8Array.from(newMaskData), intersectionBoundingBox];
  }

  /**
   * Invert the selected annotation area
   * @param selectedMask
   * @param selectedBoundingBox
   * @returns Bounding box and mask of the inverted annotation area
   */
  invert(
    selectedMask: Uint8Array,
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

    return [Uint8Array.from(croppedInvertedMask.data), invertedBoundingBox];
  }

  /**
   * Subtract the areas selected by the current AnnotationTool (subtrahend) from the selected annotation (minuend).
   * [Difference = Minuend - Subtrahend]
   * @param encodedMinuendData
   * @param minuendBoundingBox
   * @returns Bounding box and mask of the difference of the annotation areas.
   */
  subtract(
    encodedMinuendData: Uint8Array,
    minuendBoundingBox: [number, number, number, number]
  ): [Uint8Array, [number, number, number, number]] {
    if (!this._maskData || !this._boundingBox)
      return [Uint8Array.from([]), [0, 0, 0, 0]];

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
      return [Uint8Array.from([]), [0, 0, 0, 0]];
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

    return [Uint8Array.from(resultingMaskData), resultingBoundingBox];
  }
}
