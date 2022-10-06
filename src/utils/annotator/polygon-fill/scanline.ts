import * as ImageJS from "image-js";
import { Edge, Point } from "types";
import {
  getXofYMax,
  getXofYMin,
  getYMax,
  getYMin,
  interpolateX,
  pointsToEdges,
} from "utils/annotator";

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
  });

  if (polygon.length < 3) return maskImage;

  // initialize ET and AET

  const ET: Array<Edge> = pointsToEdges(polygon).sort(
    (e1: Edge, e2: Edge) => getYMin(e2) - getYMin(e1)
  );

  const AET: Array<Edge> = [];
  let yScan = getYMin(ET[ET.length - 1]);
  const allSpans = [];

  // repeat until both ET and AET are empty
  while (ET.length > 0 || AET.length > 0) {
    // manage AET
    // move active edges from ET to AET
    while (ET.length > 0 && yScan === getYMin(ET[ET.length - 1])) {
      AET.push(ET.pop()!);
    }
    // remove inactive edges from AET
    for (let i = 0; i < AET.length; i++) {
      if (yScan >= getYMax(AET[i])) {
        const last = AET.pop();
        if (i < AET.length && last) {
          AET[i] = last;
          i--;
        }
      }
    }
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
// find spans along scanline
function getSpans(yScan: number, AET: Array<Edge>) {
  const spans = [];
  for (const edge of AET) {
    spans.push(interpolateX(yScan, edge));
  }
  return spans;
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
