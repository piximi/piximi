import { AnnotationType } from "types/AnnotationType";
import * as ImageJS from "image-js";
import { Category } from "types/Category";
import * as _ from "lodash";
import { connectPoints, drawLine } from "image/imageHelper";
import { simplifyPolygon } from "../../../simplify/simplify";
import { slpf } from "../../../polygon-fill/slpf";
import { v4 as uuidv4 } from "uuid";
import { decode, encode } from "../../../rle";
import { Tool } from "../../Tool";
import { AnnotationStateType } from "types/AnnotationStateType";

export abstract class AnnotationTool extends Tool {
  /**
   * RoiManager of the annotated image.
   * https://image-js.github.io/image-js/#roi
   */
  manager: ImageJS.RoiManager;
  /**
   * Polygon that defines the annotation area, array of (x, y) coordinates.
   */
  points?: Array<number> = [];
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
   * State of the annotation: Blank (not yet annotating), Annotating or Annotated
   */
  annotationState = AnnotationStateType.Blank;
  /**
   * Annotation object of the Tool.
   */
  annotation?: AnnotationType;
  anchor?: { x: number; y: number } = undefined;
  origin?: { x: number; y: number } = undefined;
  buffer?: Array<number> = [];

  onAnnotating?: () => void;
  onAnnotated?: () => void;
  onDeselect?: () => void;

  constructor(image: ImageJS.Image) {
    super(image);

    this.manager = image.getRoiManager();
  }

  /*
   * Method for add, subtract and intersect modes.
   * Draw a ROI mask in the coordinate space of the new combined bounding box.
   * */
  drawMaskInNewBoundingBox(
    newMaskImage: ImageJS.Image,
    maskImage: ImageJS.Image,
    boundingBox: [number, number, number, number],
    newBoundingBox: [number, number, number, number]
  ) {
    for (let x = 0; x < maskImage.width; x++) {
      for (let y = 0; y < maskImage.height; y++) {
        const pixel = maskImage.getPixelXY(x, y)[0];
        if (pixel === 255) {
          newMaskImage.setPixelXY(
            x + boundingBox[0] - newBoundingBox[0],
            y + boundingBox[1] - newBoundingBox[1],
            [255]
          );
        }
      }
    }
    return newMaskImage;
  }

  inBoundingBox(
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
   * @param encodedMaskData1
   * @param boundingBox1
   * @returns Bounding box and mask of the added annotation areas
   */
  add(
    encodedMaskData1: Array<number>,
    boundingBox1: [number, number, number, number]
  ): [Array<number>, [number, number, number, number]] {
    if (!this._mask || !this._boundingBox) return [[], [0, 0, 0, 0]];

    const maskData1 = decode(encodedMaskData1);
    const maskData2 = decode(this._mask);
    const boundingBox2 = this._boundingBox;

    const newBoundingBox = [
      boundingBox2[0] < boundingBox1[0] ? boundingBox2[0] : boundingBox1[0],
      boundingBox2[1] < boundingBox1[1] ? boundingBox2[1] : boundingBox1[1],
      boundingBox2[2] > boundingBox1[2] ? boundingBox2[2] : boundingBox1[2],
      boundingBox2[3] > boundingBox1[3] ? boundingBox2[3] : boundingBox1[3],
    ] as [number, number, number, number];

    const newBoundingBoxWidth = newBoundingBox[2] - newBoundingBox[0];
    const newBoundingBoxHeight = newBoundingBox[3] - newBoundingBox[1];

    const newMaskData = [];
    const deltaX1 = boundingBox1[0] - newBoundingBox[0];
    const deltaY1 = boundingBox1[1] - newBoundingBox[1];
    const deltaX2 = boundingBox2[0] - newBoundingBox[0];
    const deltaY2 = boundingBox2[1] - newBoundingBox[1];

    for (let i = 0; i < newBoundingBoxWidth * newBoundingBoxHeight; i++) {
      const x = i % newBoundingBoxWidth;
      const y = Math.floor(i / newBoundingBoxWidth);
      const b1x = x - deltaX1;
      const b1y = y - deltaY1;
      const b2x = x - deltaX2;
      const b2y = y - deltaY2;

      const b1i = b1x + b1y * (boundingBox1[2] - boundingBox1[0]);
      const b2i = b2x + b2y * (boundingBox2[2] - boundingBox2[0]);
      if (
        (this.inBoundingBox(b1x, b1y, boundingBox1) &&
          maskData1[b1i] === 255) ||
        (this.inBoundingBox(b2x, b2y, boundingBox2) && maskData2[b2i] === 255)
      ) {
        newMaskData.push(255);
      } else {
        newMaskData.push(0);
      }
    }

    return [encode(Uint8Array.from(newMaskData)), newBoundingBox];
  }

  connect() {
    if (this.annotationState === AnnotationStateType.Annotated) return;

    if (!this.anchor || !this.origin || !this.buffer) return;

    const anchorIndex = _.findLastIndex(this.buffer, (point) => {
      return point === this.anchor!.x;
    });

    const segment = _.flatten(
      drawLine([this.anchor.x, this.anchor.y], [this.origin.x, this.origin.y])
    );

    this.buffer.splice(anchorIndex, segment.length, ...segment);

    this._boundingBox = this.computeBoundingBoxFromContours(this.buffer);

    this.points = this.buffer;

    const maskImage = this.computeAnnotationMaskFromPoints();
    if (!maskImage) return;

    this._mask = encode(maskImage.data);

    this.anchor = undefined;
    this.origin = undefined;
    this.buffer = [];

    this.setAnnotated();
  }

  /**
   * Intersect the areas selected by the current AnnotationTool and the selected annotation.
   * @param decodedMask1
   * @param boundingBox1
   * @returns Bounding box and mask of the intersected annotation areas.
   */
  intersect(
    decodedMask1: Array<number>,
    boundingBox1: [number, number, number, number]
  ): [Array<number>, [number, number, number, number]] {
    if (!this._mask || !this._boundingBox) return [[], [0, 0, 0, 0]];

    const maskData1 = decode(decodedMask1);
    const maskData2 = decode(this._mask);

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
      return [[], [0, 0, 0, 0]];
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
        this.inBoundingBox(b1x, b1y, boundingBox1) &&
        maskData1[b1i] === 255 &&
        this.inBoundingBox(b2x, b2y, boundingBox2) &&
        maskData2[b2i] === 255
      ) {
        newMaskData.push(255);
      } else {
        newMaskData.push(0);
      }
    }

    if (!newMaskData.length) return [[], [0, 0, 0, 0]];

    return [encode(Uint8Array.from(newMaskData)), intersectionBoundingBox];
  }

  /**
   * Invert the selected annotation area
   * @param selectedMask
   * @param selectedBoundingBox
   * @returns Bounding box and mask of the inverted annotation area
   */
  invert(
    selectedMask: Array<number>,
    selectedBoundingBox: [number, number, number, number]
  ): [Array<number>, [number, number, number, number]] {
    const mask = decode(selectedMask);

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
          this.inBoundingBox(x_mask, y_mask, selectedBoundingBox)
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

    const invertedMaskData = encode(Uint8Array.from(croppedInvertedMask.data));

    return [invertedMaskData, invertedBoundingBox];
  }

  /**
   * Subtract the areas selected by the current AnnotationTool (subtrahend) from the selected annotation (minuend).
   * [Difference = Minuend - Subtrahend]
   * @param encodedMinuendData
   * @param minuendBoundingBox
   * @returns Bounding box and mask of the difference of the annotation areas.
   */
  subtract(
    encodedMinuendData: Array<number>,
    minuendBoundingBox: [number, number, number, number]
  ): [Array<number>, [number, number, number, number]] {
    if (!this._mask || !this._boundingBox) return [[], [0, 0, 0, 0]];

    // decode the selected annotation data
    const minuendData = decode(encodedMinuendData);
    // decode the the subtrahend data
    const subtrahendData = decode(this._mask);

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
      return [[], [0, 0, 0, 0]];
    }

    const resultingMaskData = [];
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
        this.inBoundingBox(b1x, b1y, minuendBoundingBox) &&
        minuendData[b1i] === 255 &&
        this.inBoundingBox(b2x, b2y, subtrahendBoundingBox) &&
        subtrahendData[b2i] === 255
      ) {
        resultingMaskData.push(0);
      } else {
        resultingMaskData.push(minuendData[b1i]);
      }
    }

    return [encode(Uint8Array.from(resultingMaskData)), resultingBoundingBox];
  }

  get boundingBox(): [number, number, number, number] | undefined {
    return this._boundingBox;
  }

  set boundingBox(
    updatedBoundingBox: [number, number, number, number] | undefined
  ) {
    this._boundingBox = updatedBoundingBox;
  }

  computeBoundingBoxFromContours(
    contour: Array<number>
  ): [number, number, number, number] {
    const pairs = _.chunk(contour, 2);

    return [
      Math.round(_.min(_.map(pairs, _.first))!),
      Math.round(_.min(_.map(pairs, _.last))!),
      Math.round(_.max(_.map(pairs, _.first))!),
      Math.round(_.max(_.map(pairs, _.last))!),
    ];
  }

  /**
   * Compute the bounding box of the polygon that defined the annotation.
   * @returns bounding box [number, number, number, number] or undefined
   */
  computeBoundingBox(): [number, number, number, number] | undefined {
    if (!this.points || !this.points.length) return undefined;
    return [this.points[0], this.points[1], this.points[4], this.points[5]];
  }

  /**
   * Compute the mask image of the annotation polygon from the bounding box and the polygon points.
   * @returns Mask image of the annotation.
   */
  computeAnnotationMaskFromPoints() {
    const boundingBox = this._boundingBox;
    if (!boundingBox) return undefined;

    const width = boundingBox[2] - boundingBox[0];
    const height = boundingBox[3] - boundingBox[1];
    if (width <= 0 || height <= 0) {
      return undefined;
    }

    const coordinates = _.chunk(this.points, 2);
    const connectedPoints = connectPoints(coordinates); // get coordinates of connected points and draw boundaries of mask

    const simplifiedPoints = simplifyPolygon(connectedPoints);
    const maskImage = slpf(
      simplifiedPoints,
      this.image.width,
      this.image.height
    );

    const greyScaleMask = maskImage.getChannel(0);

    return greyScaleMask.crop({
      x: boundingBox[0],
      y: boundingBox[1],
      width: width,
      height: height,
    });
  }

  get mask(): Array<number> | undefined {
    return this._mask;
  }

  set mask(updatedMask: Array<number> | undefined) {
    this._mask = updatedMask;
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
    if (!this.boundingBox || !this.mask) return;

    this.annotation = {
      boundingBox: this.boundingBox,
      categoryId: category.id,
      id: uuidv4(),
      mask: this.mask,
      plane: plane,
    };
  }

  registerOnAnnotatingHandler(handler: () => void): void {
    this.onAnnotating = handler;
  }

  registerOnAnnotatedHandler(handler: () => void): void {
    this.onAnnotated = handler;
  }

  registerOnDeselectHandler(handler: () => void): void {
    this.onDeselect = handler;
  }

  setAnnotating() {
    this.annotationState = AnnotationStateType.Annotating;
    if (this.onAnnotating) {
      this.onAnnotating();
    }
  }

  setAnnotated() {
    this.annotationState = AnnotationStateType.Annotated;
    if (this.onAnnotated) {
      this.onAnnotated();
    }
  }

  setBlank() {
    this.annotationState = AnnotationStateType.Blank;
    if (this.onDeselect) {
      this.onDeselect();
    }
  }
}
