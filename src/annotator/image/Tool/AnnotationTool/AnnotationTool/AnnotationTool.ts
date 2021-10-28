import { AnnotationType } from "../../../../types/AnnotationType";
import * as ImageJS from "image-js";
import { CategoryType } from "../../../../types/CategoryType";
import * as _ from "lodash";
import { connectPoints, drawLine } from "../../../imageHelper";
import { simplify } from "../../../simplify/simplify";
import { slpf } from "../../../polygon-fill/slpf";
import * as uuid from "uuid";
import { decode, encode } from "../../../rle";
import { Tool } from "../../Tool";

export abstract class AnnotationTool extends Tool {
  manager: ImageJS.RoiManager;
  points?: Array<number> = [];
  annotated: boolean = false;
  annotating: boolean = false;
  annotation?: AnnotationType;

  anchor?: { x: number; y: number } = undefined;
  origin?: { x: number; y: number } = undefined;
  buffer?: Array<number> = [];

  protected _boundingBox?: [number, number, number, number];
  protected _mask?: Array<number>;

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
        // if (x > boundingBox1[2] && pixel > 0) console.info("Not supposed to happen")
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
  /*
   * Adding to a Operator adds any new areas you select to your existing
   * Operator.
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
    //
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
    if (this.annotated) return;

    if (!this.anchor || !this.origin) return;

    if (!this.buffer) return;

    const anchorIndex = _.findLastIndex(this.buffer, (point) => {
      return point === this.anchor!.x;
    });

    const segment = _.flatten(
      drawLine([this.anchor.x, this.anchor.y], [this.origin.x, this.origin.y])
    );

    this.buffer.splice(anchorIndex, segment.length, ...segment);

    this._boundingBox = this.computeBoundingBoxFromContours(this.buffer);

    this.points = this.buffer;

    const maskImage = this.computeMask().crop({
      x: this._boundingBox[0],
      y: this._boundingBox[1],
      width: this._boundingBox[2] - this._boundingBox[0],
      height: this._boundingBox[3] - this._boundingBox[1],
    });

    this._mask = encode(maskImage.data);

    console.error(maskImage.toDataURL());

    this.anchor = undefined;
    this.origin = undefined;
    this.buffer = [];

    this.annotated = true;
    this.annotating = false;
  }

  /*
   * When using the Intersect Operator mode, any currently selected areas you
   * select over will be kept and any currently selected areas outside your
   * new Operator will be removed from the Operator.
   */
  intersect(
    decodedMask1: Array<number>,
    boundingBox1: [number, number, number, number]
  ): [Array<number>, [number, number, number, number]] {
    if (!this._mask || !this._boundingBox) return [[], [0, 0, 0, 0]];

    const maskData1 = decode(decodedMask1);
    const maskData2 = decode(this._mask);

    const boundingBox2 = this._boundingBox;

    const newBoundingBox = [
      boundingBox2[0] > boundingBox1[0] ? boundingBox2[0] : boundingBox1[0],
      boundingBox2[1] > boundingBox1[1] ? boundingBox2[1] : boundingBox1[1],
      boundingBox2[2] < boundingBox1[2] ? boundingBox2[2] : boundingBox1[2],
      boundingBox2[3] < boundingBox1[3] ? boundingBox2[3] : boundingBox1[3],
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

    return [encode(Uint8Array.from(newMaskData)), newBoundingBox];
  }

  /*
   * Invert selected mask and compute inverted bounding box coordinates
   * */
  invert(
    selectedMask: Array<number>,
    selectedBoundingBox: [number, number, number, number]
  ): [Array<number>, [number, number, number, number]] {
    const mask = decode(selectedMask);

    const imageWidth = this.image.width;
    const imageHeight = this.image.height;

    //find min and max boundary points when computing the mask
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

    //now crop the mask using the new bounding box
    const croppedInvertedMask = invertedMask.crop({
      x: invertedBoundingBox[0],
      y: invertedBoundingBox[1],
      width: invertedBoundingBox[2] - invertedBoundingBox[0],
      height: invertedBoundingBox[3] - invertedBoundingBox[1],
    });

    const invertedmaskData = encode(Uint8Array.from(croppedInvertedMask.data));

    return [invertedmaskData, invertedBoundingBox];
  }

  /*
   * Subtracting from a Operator deselects the areas you draw over, keeping
   * the rest of your existing Operator.
   */
  subtract(
    encodedMaskData1: Array<number>,
    boundingBox1: [number, number, number, number]
  ): [Array<number>, [number, number, number, number]] {
    if (!this._mask || !this._boundingBox) return [[], [0, 0, 0, 0]];

    const maskData1 = decode(encodedMaskData1);
    const maskData2 = decode(this._mask);

    const boundingBox2 = this._boundingBox;

    const newBoundingBox = [
      boundingBox2[2] > boundingBox1[0] &&
      boundingBox2[0] < boundingBox1[0] &&
      boundingBox2[1] < boundingBox1[1] &&
      boundingBox2[3] > boundingBox1[3]
        ? boundingBox2[2]
        : boundingBox1[0],
      boundingBox2[3] > boundingBox1[1] &&
      boundingBox2[1] < boundingBox1[1] &&
      boundingBox2[0] < boundingBox1[0] &&
      boundingBox2[2] > boundingBox1[2]
        ? boundingBox2[3]
        : boundingBox1[1],
      boundingBox2[0] < boundingBox1[2] &&
      boundingBox2[2] > boundingBox1[2] &&
      boundingBox2[1] < boundingBox1[1] &&
      boundingBox2[3] > boundingBox1[3]
        ? boundingBox2[0]
        : boundingBox1[2],
      boundingBox2[1] < boundingBox1[3] &&
      boundingBox2[3] > boundingBox1[3] &&
      boundingBox2[0] < boundingBox1[0] &&
      boundingBox2[2] > boundingBox1[2]
        ? boundingBox2[1]
        : boundingBox1[3],
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
        this.inBoundingBox(b1x, b1y, boundingBox1) &&
        maskData1[b1i] === 255 &&
        this.inBoundingBox(b2x, b2y, boundingBox2) &&
        maskData2[b2i] === 255
      ) {
        newMaskData.push(0);
      } else {
        newMaskData.push(maskData1[b1i]);
      }
    }

    return [encode(Uint8Array.from(newMaskData)), newBoundingBox];
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

  computeMask() {
    const maskImage = new ImageJS.Image({
      width: this.image.width,
      height: this.image.height,
      bitDepth: 8,
    });

    const coords = _.chunk(this.points, 2);

    const connectedPoints = connectPoints(coords, maskImage); // get coordinates of connected points and draw boundaries of mask
    simplify(connectedPoints, 1, true);
    slpf(connectedPoints, maskImage);

    //@ts-ignore
    return maskImage.getChannel(0);
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

  annotate(category: CategoryType): void {
    if (!this.boundingBox || !this.mask) return;

    this.annotation = {
      boundingBox: this.boundingBox,
      categoryId: category.id,
      id: uuid.v4(),
      mask: this.mask,
    };
  }
}
