import { min, max } from "lodash";

import { connectPoints } from "./imageHelper";
import { scanline } from "./scanline";
import { simplifyPolygon } from "./simplify";
import { Edge, Point } from "./types";

export const pointsAreEqual = (p1: Point, p2: Point) => {
  return p1.x === p2.x && p1.y === p2.y;
};

export const getDistance = (p1: Point, p2: Point) => {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
};

// returns minimum y-value of two points
export function getYMin(edge: Edge) {
  return edge.p1.y <= edge.p2.y ? edge.p1.y : edge.p2.y;
}

// returns maximum y-value of two points
export function getYMax(edge: Edge) {
  return edge.p1.y > edge.p2.y ? edge.p1.y : edge.p2.y;
}

// returns the x-value of the point with the minimum y-value
export function getXofYMin(edge: Edge) {
  return edge.p1.y <= edge.p2.y ? edge.p1.x : edge.p2.x;
}

// returns the x-value of the point with the maximum y-value
export function getXofYMax(edge: Edge) {
  return edge.p1.y > edge.p2.y ? edge.p1.x : edge.p2.x;
}

// converts list of points to list of non-horizontal edges
export function pointsToEdges(points: Array<Point>) {
  let edges: Array<Edge> = [];
  let p1 = points.at(-1)!;
  for (let i = 0; i < points.length; i++) {
    const p2 = points[i];
    // ignore horizontal edges
    if (p1.y !== p2.y) edges.push({ p1: p1, p2: p2 });
    p1 = p2;
  }
  return edges;
}

// linear interpolation
// finds x-value from scanline intersecting edge
export function interpolateX(yScan: number, edge: Edge) {
  const y1 = edge.p1.y;
  const y2 = edge.p2.y;
  const x1 = edge.p1.x;
  const x2 = edge.p2.x;
  return Math.floor(((yScan - y1) / (y2 - y1)) * (x2 - x1) + x1);
}

export function computeBoundingBoxFromContours(
  contour: Array<Point>
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
  simplifyPoints: boolean = true
) {
  if (!boundingBox) {
    boundingBox = computeBoundingBoxFromContours(coordinates);
  }

  const width = boundingBox[2] - boundingBox[0];
  const height = boundingBox[3] - boundingBox[1];

  if (width <= 0 || height <= 0) {
    process.env.NODE_ENV !== "production" &&
      console.warn(
        `Received negative image dimensions w: ${width}, h: ${height}`
      );
    throw Error(
      "Could not calculate mask from points, with given image dimensions"
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
    imageDims.height
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
