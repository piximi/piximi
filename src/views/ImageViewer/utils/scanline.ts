import * as ImageJS from "image-js";

import {
  getXofYMax,
  getXofYMin,
  getYMax,
  getYMin,
  interpolateX,
  pointsToEdges,
} from "./point-operations";
import { Edge, Point } from "./types";

/**
 * Scan Line Polygon Fill (SLPF) algorithm to fill the annotation polygon.
 * @param polygon Polygon that defines the annotation.
 * @param imageWidth Width of the annotated image.
 * @param imageHeight Height of the annotated image.
 * @returns Annotation Mask
 */

export function scanline(
  polygon: Array<Point>,
  imageWidth: number,
  imageHeight: number
) {
  const maskImage = new ImageJS.Image({
    width: imageWidth,
    height: imageHeight,
    bitDepth: 8,
    components: 1,
    alpha: 0,
    kind: "GREY" as ImageJS.ImageKind,
  });

  if (polygon.length < 3) return maskImage;

  // initialize the edge and active edge tables

  const edgeTable: Array<Edge> = pointsToEdges(polygon).sort(
    (e1: Edge, e2: Edge) => getYMin(e2) - getYMin(e1)
  );

  const activeEdgeTable: Array<Edge> = [];
  let yScan = getYMin(edgeTable.at(-1)!);
  const allSpans = [];

  // repeat until both the edge and active edge tables are empty
  while (edgeTable.length > 0 || activeEdgeTable.length > 0) {
    // move active edges from edge table to active edge table
    while (edgeTable.length > 0 && yScan === getYMin(edgeTable.at(-1)!)) {
      if (edgeTable.length > 0) activeEdgeTable.push(edgeTable.pop()!);
    }
    // remove inactive edges from active edge table
    for (let i = 0; i < activeEdgeTable.length; i++) {
      if (yScan >= getYMax(activeEdgeTable[i])) {
        const last = activeEdgeTable.pop();
        if (i < activeEdgeTable.length && last) {
          activeEdgeTable[i] = last;
          i--;
        }
      }
    }
    activeEdgeTable.sort((e1, e2) => {
      const cmp = getXofYMin(e1) - getXofYMin(e2);
      return cmp === 0 ? getXofYMax(e1) - getXofYMax(e2) : cmp;
    });
    // fill spans on scanline
    const spans = getSpans(yScan, activeEdgeTable);
    drawSpans(spans, yScan, maskImage);
    allSpans.push([spans, [yScan, yScan]]);
    yScan++;
  }
  return maskImage;
}
/**
 * Finds the intersections of the scanline and active edges
 * @param yScan y-coordinate of the current scanline
 * @param activeEdgeTable active edge table
 * @returns Array containing x-coordinates of the active edges at the current scanline location
 */
function getSpans(yScan: number, activeEdgeTable: Array<Edge>) {
  const spans = [];
  for (const edge of activeEdgeTable) {
    spans.push(interpolateX(yScan, edge));
  }
  return spans;
}

/**
 * Sorts intersection points and couples pairs for filling
 * @param spans Array of intersection points
 * @param yScan
 * @param img
 */
function drawSpans(spans: Array<number>, yScan: number, img: ImageJS.Image) {
  spans.sort((e1, e2) => e1 - e2);

  for (let i = 0; i < spans.length; i += 2) {
    fillSpan(spans[i], spans[i + 1], yScan, img);
  }
}

/**
 * Fills in span from xMin to xMax
 * @param x1 xMin of span
 * @param x2 xMax of span
 * @param y y-coord of current spanline
 * @param img Image on which the annotation id drawn
 *
 */
function fillSpan(x1: number, x2: number, y: number, img: ImageJS.Image) {
  for (let x = x1; x < x2; x++) {
    img.setPixelXY(x, y, [255]);
  }
}
