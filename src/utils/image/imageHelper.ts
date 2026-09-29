import { pointsAreEqual } from "./point-operations";
import { decodeRleArray } from "./rle";

import type { DataArray, BBox, ExtendedAnnotationObject } from "core/entities";

import type { Point } from "utils/types";

const pointInBox = (point: Point, box: [number, number, number, number]) => {
  return (
    point.x >= box[0] &&
    point.x <= box[2] &&
    point.y >= box[1] &&
    point.y <= box[3]
  );
};

const pointOnMask = (
  point: Point,
  bbox: BBox,
  encodedMask: number[],
  decodedMask?: DataArray,
) => {
  const bboxW = bbox[2] - bbox[0];
  const bboxH = bbox[3] - bbox[1];
  if (!pointInBox(point, bbox) || !(bboxH && bboxW)) return false;

  const relX = point.x - bbox[0];
  const relY = point.y - bbox[1];
  const pointIdx = relY * bboxW + relX;
  const dMask = decodedMask ?? decodeRleArray(encodedMask);
  //return annotation if clicked on actual selected data
  return dMask[pointIdx] > 0;
};

export const connectPoints = (coordinates: Array<Point>) => {
  let connectedPoints: Array<Point> = [];

  const consecutiveCoords = coordinates
    .slice(0, coordinates.length - 1)
    .map((coord, i) => [coord, coordinates[i + 1]]);

  const adjacentPoints = consecutiveCoords.filter(
    ([current, next]) => !pointsAreEqual(current, next),
  );

  adjacentPoints.forEach(([current, next]) => {
    const points = drawLine(current!, next!);
    connectedPoints = connectedPoints.concat(points);
  });

  return connectedPoints;
};

const drawLine = (p1: Point, p2: Point) => {
  const coords: Array<Point> = [];

  let x: number, y: number, dx: number, dy: number, i: number;

  const x1 = Math.round(p1.x);
  const y1 = Math.round(p1.y);
  const x2 = Math.round(p2.x);
  const y2 = Math.round(p2.y);

  dx = x2 - x1;
  dy = y2 - y1;

  const step = Math.abs(dx) >= Math.abs(dy) ? Math.abs(dx) : Math.abs(dy);

  dx = dx / step;
  dy = dy / step;
  x = x1;
  y = y1;
  i = 1;

  while (i <= step) {
    coords.push({ x: Math.round(x), y: Math.round(y) });
    x = x + dx;
    y = y + dy;
    i = i + 1;
  }

  return coords;
};

export const drawRectangle = (
  origin: Point | undefined,
  width: number | undefined,
  height: number | undefined,
) => {
  if (!width || !height || !origin) return [];

  const points: Array<Point> = [];

  // Negative height and width may happen if the rectangle was drawn from right to left.
  if (width < 0) {
    width = Math.abs(width);
    origin.x = origin.x - width;
  }
  if (height < 0) {
    height = Math.abs(height);
    origin.y = origin.y - height;
  }

  // Add corners of the bounding box.
  const x1 = Math.round(origin.x);
  const y1 = Math.round(origin.y);
  const x2 = Math.round(origin.x + width);
  const y2 = Math.round(origin.y + height);
  points.push(
    ...[
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ],
  );

  return points;
};

export const getIdx = (
  width: number,
  nchannels: number,
  x: number,
  y: number,
  index: number,
) => {
  index = index || 0;
  return Math.floor((width * y + x) * nchannels + index);
};

/*
Given a click at a position, return all overlapping annotations ids
 */
export const getOverlappingAnnotations = (
  position: { x: number; y: number },
  annotations: ExtendedAnnotationObject[],
) => {
  const overlappingAnnotations = annotations.filter((annotation) =>
    pointOnMask(
      position,
      annotation.boundingBox,
      annotation.encodedMask,
      annotation.decodedMask,
    ),
  );
  return overlappingAnnotations.map((annotation) => {
    return annotation.id;
  });
};

export const getAnnotationsInBox = (
  minimum: { x: number; y: number },
  maximum: { x: number; y: number },
  annotations: ExtendedAnnotationObject[],
) => {
  return annotations.filter((annotation) => {
    return (
      minimum.x <= annotation.boundingBox[0] &&
      minimum.y <= annotation.boundingBox[1] &&
      maximum.x >= annotation.boundingBox[2] &&
      maximum.y >= annotation.boundingBox[3]
    );
  });
};

/**
 * Rasterize a bbox-sized binary mask to an RGBA data URL, for the SVG overlay's
 * `<image>` element, which needs a URL rather than pixel data. Interior pixels
 * get alpha 128 and border pixels 255, matching what `annotationMask.frag`
 * applies to the Three.js meshes.
 */
export const maskToDataURL = (
  mask: DataArray,
  w: number,
  h: number,
  color: [number, number, number],
): string | undefined => {
  if (!mask || w <= 0 || h <= 0 || mask.length !== w * h) return undefined;

  // Zero-filled, so background pixels are already transparent.
  const rgba = new Uint8ClampedArray(w * h * 4);
  const [r, g, b] = color;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!mask[i]) continue;

      // Border if any 4-neighbour is background or out of bounds — the same
      // rule annotationMask.frag applies via maskAt.
      const border =
        x === 0 ||
        x === w - 1 ||
        y === 0 ||
        y === h - 1 ||
        !mask[i - 1] ||
        !mask[i + 1] ||
        !mask[i - w] ||
        !mask[i + w];

      const o = i * 4;
      rgba[o] = r;
      rgba[o + 1] = g;
      rgba[o + 2] = b;
      rgba[o + 3] = border ? 255 : 128;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  ctx.putImageData(new ImageData(rgba, w, h), 0, 0);
  return canvas.toDataURL();
};

/*
 * from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
 * */
export const hexToRGBA = (color: string, alpha?: number) => {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const a = alpha
    ? alpha
    : color.length === 9
      ? parseInt(color.slice(7, 9), 16)
      : undefined;

  return a ? [r, g, b, a] : [r, g, b];
  // return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
