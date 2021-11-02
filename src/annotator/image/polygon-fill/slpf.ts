// Code from: https://github.com/kamoroso94/polygon-fill-benchmark

import * as ImageJS from "image-js";

import {
  getXofYMax,
  getXofYMin,
  getYMax,
  getYMin,
  lerp,
  pointsToEdges,
} from "./util";

// Scnaline Polygon Fill
export function slpf(points: Array<Array<number>>, img: ImageJS.Image) {
  if (points.length < 3) return;

  // initialize ET and AET
  const ET: Array<Array<Array<number>>> = pointsToEdges(points).sort(
    (e1: Array<Array<number>>, e2: Array<Array<number>>) =>
      getYMin(e2) - getYMin(e1)
  );
  const AET: Array<Array<Array<number>>> = [];
  let yScan = getYMin(ET[ET.length - 1]);

  // repeat until both ET and AET are empty
  while (ET.length > 0 || AET.length > 0) {
    // manage AET
    moveEdges(yScan, ET, AET);
    removeEdges(yScan, AET);
    AET.sort((e1, e2) => {
      const cmp = getXofYMin(e1) - getXofYMin(e2);
      return cmp == 0 ? getXofYMax(e1) - getXofYMax(e2) : cmp;
    });
    // fill spans on scanline
    const spans = getSpans(yScan, AET);
    drawSpans(spans, yScan, img);
    yScan++;
  }
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

function drawSpans(spans: Array<number>, yScan: number, img: ImageJS.Image) {
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
