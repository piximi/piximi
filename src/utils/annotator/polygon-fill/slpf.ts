// Code from: https://github.com/kamoroso94/polygon-fill-benchmark

import * as ImageJS from "image-js";

/**
 * Scan Line Polygon Fill (SLPF) algorithm to fill the annotation polygon.
 * @param polygon Polygon that defines the annotation.
 * @param imageWidth Width of the annotated image.
 * @param imageHeight Height of the annotated image.
 * @returns Annotation Mask
 */
export function slpf(
  polygon: Array<Array<number>>,
  imageWidth: number,
  imageHeight: number
) {
  const maskImage = new ImageJS.Image({
    width: imageWidth,
    height: imageHeight,
    bitDepth: 8,
  });

  if (polygon.length < 3) return maskImage;

  // initialize ET and AET

  const ET: Array<Array<Array<number>>> = pointsToEdges(polygon).sort(
    (e1: Array<Array<number>>, e2: Array<Array<number>>) =>
      getYMin(e2) - getYMin(e1)
  );

  const AET: Array<Array<Array<number>>> = [];
  let yScan = getYMin(ET[ET.length - 1]);
  const allSpans = [];

  // repeat until both ET and AET are empty
  while (ET.length > 0 || AET.length > 0) {
    // manage AET
    moveEdges(yScan, ET, AET);
    removeEdges(yScan, AET);
    AET.sort((e1, e2) => {
      const cmp = getXofYMin(e1) - getXofYMin(e2);
      return cmp === 0 ? getXofYMax(e1) - getXofYMax(e2) : cmp;
    });
    // fill spans on scanline
    const spans = getSpans(yScan, AET);
    drawSpans(spans, yScan, maskImage);
    allSpans.push([spans, [yScan, yScan]]);
    yScan++;
  }
  return maskImage;
}

// move active edges from ET to AET
function moveEdges(
  yScan: number,
  ET: Array<Array<Array<number>>>,
  AET: Array<Array<Array<number>>>
) {
  while (ET.length > 0 && yScan === getYMin(ET[ET.length - 1])) {
    AET.push(ET.pop()!);
  }
}

// remove inactive edges from AET
function removeEdges(yScan: number, AET: Array<Array<Array<number>>>) {
  for (let i = 0; i < AET.length; i++) {
    if (yScan >= getYMax(AET[i])) {
      const last = AET.pop();
      if (i < AET.length && last) {
        AET[i] = last;
        i--;
      }
    }
  }
}

// find spans along scanline
function getSpans(yScan: number, AET: Array<Array<Array<number>>>) {
  const spans = [];
  for (const edge of AET) {
    spans.push(lerp(yScan, edge));
  }
  return spans;
}
// linear interpolation
// finds x-value from scanline intersecting edge
export function lerp(
  yScan: number,
  [[x1, y1], [x2, y2]]: Array<Array<number>>
) {
  return Math.floor(((yScan - y1) / (y2 - y1)) * (x2 - x1) + x1);
}
function drawSpans(spans: Array<number>, yScan: number, img: ImageJS.Image) {
  spans.sort((e1, e2) => e1 - e2);

  for (let i = 0; i < spans.length; i += 2) {
    fillSpan(spans[i], spans[i + 1], yScan, img);
  }
}

// fill pixels within a span
function fillSpan(x1: number, x2: number, y: number, img: ImageJS.Image) {
  for (let x = x1; x < x2; x++) {
    img.setPixelXY(x, y, [255, 255, 255, 255]);
  }
}

// Code from: https://github.com/kamoroso94/polygon-fill-benchmark

// returns minimum y-value of two points
export function getYMin([[, y1], [, y2]]: Array<Array<number>>) {
  return y1 <= y2 ? y1 : y2;
}

// returns maximum y-value of two points
export function getYMax([[, y1], [, y2]]: Array<Array<number>>) {
  return y1 > y2 ? y1 : y2;
}

// returns the x-value of the point with the minimum y-value
export function getXofYMin([[x1, y1], [x2, y2]]: Array<Array<number>>) {
  return y1 <= y2 ? x1 : x2;
}

// returns the x-value of the point with the maximum y-value
export function getXofYMax([[x1, y1], [x2, y2]]: Array<Array<number>>) {
  return y1 > y2 ? x1 : x2;
}

// converts list of points to list of non-horizontal edges
export function pointsToEdges(points: Array<Array<number>>) {
  let edges = [];
  let p1 = points[points.length - 1];
  for (let i = 0; i < points.length; i++) {
    const p2 = points[i];
    // ignore horizontal edges
    if (p1[1] !== p2[1]) edges.push([p1, p2]);
    p1 = p2;
  }
  return edges;
}
