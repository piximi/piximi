import { min, max } from "lodash";

import { connectPoints } from "./imageHelper";
import { scanline } from "./scanline";
import { simplifyPolygon } from "./simplify";
import { Point } from "./types";
export function computeBoundingBoxFromContours(
  contour: Array<Point>,
): [number, number, number, number] {
  if (contour.length === 0) return [0, 0, 0, 0];

  const xValues = contour.map((point) => point.x);
  const yValues = contour.map((point) => point.y);
  return [
    Math.round(min(xValues)!),
    Math.round(min(yValues)!),
    Math.round(max(xValues)!),
    Math.round(max(yValues)!),
  ];
}

/**
 * Compute the mask image of the annotation polygon from the bounding box and the polygon points.
 * @returns Mask image of the annotation.
 */
export function maskFromPoints(
  coordinates: Array<Point>,
  imageDims: { width: number; height: number },
  boundingBox?: [number, number, number, number],
  simplifyPoints: boolean = true,
) {
  if (!boundingBox) {
    boundingBox = computeBoundingBoxFromContours(coordinates);
  }

  const width = boundingBox[2] - boundingBox[0];
  const height = boundingBox[3] - boundingBox[1];

  if (width <= 0 || height <= 0) {
    import.meta.env.NODE_ENV !== "production" &&
      console.warn(
        `Received negative image dimensions w: ${width}, h: ${height}`,
      );
    throw Error(
      "Could not calculate mask from points, with given image dimensions",
    );
  }

  // get coordinates of connected points and draw boundaries of mask
  let connectedPoints = connectPoints(coordinates);

  if (simplifyPoints) {
    connectedPoints = simplifyPolygon(connectedPoints);
  }

  const greyScaleMask = scanline(
    connectedPoints,
    imageDims.width,
    imageDims.height,
  );

  const maskImage = greyScaleMask.crop({
    x: boundingBox[0],
    y: boundingBox[1],
    width: width,
    height: height,
  });

  // Uint8Array because scanline generated an image of bitdepth 8
  return maskImage.data as Uint8Array;
}
