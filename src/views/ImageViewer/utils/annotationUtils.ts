import { DataArray } from "utils/file-io/types";
import * as ImageJS from "image-js";
import { convertToDataArray } from "utils/common/helpers";

/**
 * Checks if a point lies within an annotation bounding box
 * @param x x-coord of point
 * @param y y-coord of point
 * @param boundingBox Bounding box of annotation
 * @returns true if point lies within the bounding box, false otherwise
 */
export const isInBoundingBox = (
  x: number,
  y: number,
  boundingBox: [number, number, number, number],
) => {
  if (x < 0 || y < 0) return false;
  if (x >= boundingBox[2] - boundingBox[0]) return false;
  if (y >= boundingBox[3] - boundingBox[1]) return false;
  return true;
};

/**
 * Invert the selected annotation area
 * @param selectedMask
 * @param selectedBoundingBox
 * @returns Bounding box and encodedMask of the inverted annotation area
 */
export const invert = (
  selectedMask: DataArray,
  selectedBoundingBox: [number, number, number, number],
  imageWidth: number,
  imageHeight: number,
): [Uint8Array, [number, number, number, number]] => {
  const encodedMask = selectedMask;

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
        isInBoundingBox(x_encodedMask, y_encodedMask, selectedBoundingBox)
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
};
