import IJSImage from "image-js";
import { pointsAreEqual } from "./point-operations";

import { logger } from "utils/logUtils";
import { ProtoAnnotationObject } from "./types";
import { DataArray } from "store/data/types";
import { Point } from "utils/types";

export const generatePoints = (buffer: Array<number> | undefined) => {
  if (!buffer) return undefined;
  const pointArray: Array<Point> = [];
  buffer.forEach((q, idx) => {
    if ((idx + 1) % 2 === 0) {
      pointArray.push({ x: buffer[idx - 1], y: q });
    }
  });
  return pointArray;
};

const pointInBox = (point: Point, box: [number, number, number, number]) => {
  return (
    point.x >= box[0] &&
    point.x <= box[2] &&
    point.y >= box[1] &&
    point.y <= box[3]
  );
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
  annotations: Array<ProtoAnnotationObject>,
) => {
  const overlappingAnnotations = annotations.filter(
    (annotation: ProtoAnnotationObject) => {
      const boundingBox = annotation.boundingBox;
      if (pointInBox(position, boundingBox)) {
        const boundingBoxWidth = boundingBox[2] - boundingBox[0];
        const boundingBoxHeight = boundingBox[3] - boundingBox[1];
        if (boundingBoxHeight && boundingBoxWidth) {
          //return annotation if clicked on actual selected data
          const maskROI = new IJSImage(
            boundingBoxWidth,
            boundingBoxHeight,
            annotation.decodedMask,
            { components: 1, alpha: 0 },
          );
          if (
            maskROI.getPixelXY(
              Math.round(position.x - boundingBox[0]),
              Math.round(position.y - boundingBox[1]),
            )[0]
          )
            return true;
        }
      }
      return false;
    },
  );
  return overlappingAnnotations.map((annotation: ProtoAnnotationObject) => {
    return annotation.id;
  });
};

export const getAnnotationsInBox = (
  minimum: { x: number; y: number },
  maximum: { x: number; y: number },
  annotations: Array<ProtoAnnotationObject>,
) => {
  return annotations.filter((annotation: ProtoAnnotationObject) => {
    return (
      minimum.x <= annotation.boundingBox[0] &&
      minimum.y <= annotation.boundingBox[1] &&
      maximum.x >= annotation.boundingBox[2] &&
      maximum.y >= annotation.boundingBox[3]
    );
  });
};

/*
 * From encoded mask data, get the decoded data and return results as an HTMLImageElement to be used by Konva.Image
 * Warning: the mask produced from the decoded data is scaled to fit the stage.
 *          when creating an image from mask, the original width/height should be scaled by the same scale factor
 */
export const colorOverlayROI = (
  decodedMask: DataArray,
  boundingBox: [number, number, number, number],
  imageWidth: number,
  imageHeight: number,
  color: Array<number>,
  scalingFactor: number,
): HTMLImageElement | undefined => {
  if (!decodedMask) return undefined;

  const endX = Math.min(imageWidth, boundingBox[2]);
  const endY = Math.min(imageHeight, boundingBox[3]);

  //extract bounding box params
  const boxWidth = endX - boundingBox[0];
  const boxHeight = endY - boundingBox[1];

  // const boxWidth = boundingBox[2] - boundingBox[0];
  // const boxHeight = boundingBox[3] - boundingBox[1];

  if (!boxWidth || !boxHeight) return undefined;
  let croppedImage = new IJSImage(
    boxWidth,
    boxHeight,
    Array(boxHeight * boxWidth).fill(0),
    {
      components: 1,
      alpha: 0,
    },
  ).resize({ factor: scalingFactor });
  try {
    croppedImage = new IJSImage(boxWidth, boxHeight, decodedMask, {
      components: 1,
      alpha: 0,
    }).resize({ factor: scalingFactor });
  } catch (err) {
    if (import.meta.env.NODE_ENV !== "production") {
      logger("could not create crop", { level: "error" });
      logger(`boundingbox: ${boundingBox}`);
      logger(`boxWidth: ${boxWidth}`);
      logger(`boxHeight: ${boxHeight}`);
      logger(`bwxbh: ${boxHeight * boxWidth}`);
      logger(`decodedMask length: ${decodedMask.length}`);
      logger(`diff: ${boxHeight * boxWidth - decodedMask.length}`);
      logger(err, { level: "error" });
    }
  }

  const colorROIImage = new IJSImage(boxWidth, boxHeight, {
    components: 3,
    alpha: 1,
  }).resize({ factor: scalingFactor });

  const checkNeighbors = (arr: IJSImage, x: number, y: number): boolean => {
    if (x === 0 || x === croppedImage.width - 1) return true;
    for (const [dx, dy] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]) {
      if (!arr.getPixelXY(x + dx, y + dy)[0]) return true;
    }
    return false;
  };

  for (let i = 0; i < croppedImage.width; i++) {
    for (let j = 0; j < croppedImage.height; j++) {
      if (croppedImage.getPixelXY(i, j)[0] > 0) {
        if (checkNeighbors(croppedImage, i, j)) {
          colorROIImage.setPixelXY(i, j, [color[0], color[1], color[2], 255]);
        } else {
          colorROIImage.setPixelXY(i, j, [
            color[0],
            color[1],
            color[2],
            color[3] ?? 128,
          ]);
        }
      } else {
        colorROIImage.setPixelXY(i, j, [0, 0, 0, 0]);
      }
    }
  }

  const src = colorROIImage.toDataURL("image-png", {
    useCanvas: true,
  });
  const image = new Image();
  image.src = src;

  return image;
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
