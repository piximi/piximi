import * as ImageJS from "image-js";
import _ from "lodash";
import { saveAs } from "file-saver";

import { decode, pointsAreEqual } from "utils/annotator";

import {
  encodedAnnotationType,
  decodedAnnotationType,
  Category,
  ShadowImageType,
  Point,
} from "types";

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

export const connectPoints = (coordinates: Array<Point>) => {
  let connectedPoints: Array<Point> = [];

  const consecutiveCoords = coordinates
    .slice(0, coordinates.length - 1)
    .map((coord, i) => [coord, coordinates[i + 1]]);

  const adjacentPoints = consecutiveCoords.filter(
    ([current, next]) => !pointsAreEqual(current, next)
  );

  adjacentPoints.forEach(([current, next]) => {
    const points = drawLine(current!, next!);
    connectedPoints = connectedPoints.concat(points);
  });

  return connectedPoints;
};

export const drawLine = (p1: Point, p2: Point) => {
  const coords: Array<Point> = [];

  let x: number,
    y: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    dx: number,
    dy: number,
    step: number,
    i: number;

  x1 = Math.round(p1.x);
  y1 = Math.round(p1.y);
  x2 = Math.round(p2.x);
  y2 = Math.round(p2.y);

  dx = x2 - x1;
  dy = y2 - y1;

  step = Math.abs(dx) >= Math.abs(dy) ? Math.abs(dx) : Math.abs(dy);

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
  height: number | undefined
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
    ]
  );

  return points;
};

export const getIdx = (
  width: number,
  nchannels: number,
  x: number,
  y: number,
  index: number
) => {
  index = index || 0;
  return Math.floor((width * y + x) * nchannels + index);
};

/*
Given a click at a position, return all overlapping annotations ids
 */
export const getOverlappingAnnotations = (
  position: { x: number; y: number },
  annotations: Array<decodedAnnotationType>,
  imageWidth: number,
  imageHeight: number
) => {
  const overlappingAnnotations = annotations.filter(
    (annotation: decodedAnnotationType) => {
      const boundingBox = annotation.boundingBox;
      if (
        position.x >= boundingBox[0] &&
        position.x <= boundingBox[2] &&
        position.y >= boundingBox[1] &&
        position.y <= boundingBox[3]
      ) {
        const boundingBoxWidth = boundingBox[2] - boundingBox[0];
        const boundingBoxHeight = boundingBox[3] - boundingBox[1];
        if (boundingBoxHeight && boundingBoxWidth) {
          //return annotation if clicked on actual selected data
          const maskROI = new ImageJS.Image(
            boundingBox[2] - boundingBox[0],
            boundingBox[3] - boundingBox[1],
            annotation.maskData,
            { components: 1, alpha: 0 }
          );
          if (
            maskROI.getPixelXY(
              Math.round(position.x - boundingBox[0]),
              Math.round(position.y - boundingBox[1])
            )[0]
          )
            return true;
        }
      }
      return false;
    }
  );
  return overlappingAnnotations.map((annotation: decodedAnnotationType) => {
    return annotation.id;
  });
};

export const getAnnotationsInBox = (
  minimum: { x: number; y: number },
  maximum: { x: number; y: number },
  annotations: Array<decodedAnnotationType>
) => {
  return annotations.filter((annotation: decodedAnnotationType) => {
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
  maskData: Uint8Array,
  boundingBox: [number, number, number, number],
  imageWidth: number,
  imageHeight: number,
  color: Array<number>,
  scalingFactor: number
): HTMLImageElement | undefined => {
  if (!maskData) return undefined;

  const endX = Math.min(imageWidth, boundingBox[2]);
  const endY = Math.min(imageHeight, boundingBox[3]);

  //extract bounding box params
  const boxWidth = endX - boundingBox[0];
  const boxHeight = endY - boundingBox[1];

  if (!boxWidth || !boxHeight) return undefined;

  const croppedImage = new ImageJS.Image(boxWidth, boxHeight, maskData, {
    components: 1,
    alpha: 0,
  }).resize({ factor: scalingFactor });

  const colorROIImage = new ImageJS.Image(boxWidth, boxHeight, {
    components: 3,
    alpha: 1,
  }).resize({ factor: scalingFactor });

  const checkNeighbors = (
    arr: ImageJS.Image,
    x: number,
    y: number
  ): boolean => {
    if (x === 0 || x === croppedImage.width - 1) return true;
    for (let [dx, dy] of [
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
          colorROIImage.setPixelXY(i, j, [color[0], color[1], color[2], 128]);
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

export const saveAnnotationsAsBinaryInstanceSegmentationMasks = (
  images: Array<ShadowImageType>,
  categories: Array<Category>,
  zip: any
): any => {
  images.forEach((current: ShadowImageType) => {
    current.annotations.forEach((annotation: encodedAnnotationType) => {
      const height = current.shape.height;
      const width = current.shape.width;

      const fullLabelImage = new ImageJS.Image(
        width,
        height,
        new Uint8Array().fill(0),
        { components: 1, alpha: 0 }
      );
      const decoded = decode(annotation.mask);
      const boundingBox = annotation.boundingBox;
      const endX = Math.min(width, boundingBox[2]);
      const endY = Math.min(height, boundingBox[3]);

      //extract bounding box params
      const boundingBoxWidth = endX - boundingBox[0];
      const boundingBoxHeight = endY - boundingBox[1];

      const roiMask = new ImageJS.Image(
        boundingBoxWidth,
        boundingBoxHeight,
        decoded,
        {
          components: 1,
          alpha: 0,
        }
      );
      for (let i = 0; i < boundingBoxWidth; i++) {
        for (let j = 0; j < boundingBoxHeight; j++) {
          if (roiMask.getPixelXY(i, j)[0] > 0) {
            fullLabelImage.setPixelXY(
              i + annotation.boundingBox[0],
              j + annotation.boundingBox[1],
              [255, 255, 255]
            );
          }
        }
      }
      const blob = fullLabelImage.toBlob("image/png");
      const category = categories.find((category: Category) => {
        return category.id === annotation.categoryId;
      });
      if (category) {
        zip.folder(`${current.name}/${category.name}`);
        zip.file(
          `${current.name}/${category.name}/${annotation.id}.png`,
          blob,
          {
            base64: true,
          }
        );
      }
    });
  });
  zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
    saveAs(blob, "binary_instances.zip");
  });
};

export const saveAnnotationsAsLabeledSemanticSegmentationMasks = (
  images: Array<ShadowImageType>,
  categories: Array<Category>,
  zip: any
): any => {
  images.forEach((current: ShadowImageType) => {
    const height = current.shape.height;
    const width = current.shape.width;

    const fullLabelImage = new ImageJS.Image(
      width,
      height,
      new Uint8Array().fill(0),
      { components: 1, alpha: 0 }
    );
    categories.forEach((category: Category) => {
      const categoryColor = hexToRGBA(category.color);
      if (!categoryColor) return;

      for (let annotation of current.annotations) {
        if (annotation.categoryId !== category.id) continue;
        const decoded = decode(annotation.mask);
        const boundingBox = annotation.boundingBox;
        const endX = Math.min(width, boundingBox[2]);
        const endY = Math.min(height, boundingBox[3]);

        //extract bounding box params
        const boundingBoxWidth = endX - boundingBox[0];
        const boundingBoxHeight = endY - boundingBox[1];

        const roiMask = new ImageJS.Image(
          boundingBoxWidth,
          boundingBoxHeight,
          decoded,
          {
            components: 1,
            alpha: 0,
          }
        );
        for (let i = 0; i < boundingBoxWidth; i++) {
          for (let j = 0; j < boundingBoxHeight; j++) {
            if (roiMask.getPixelXY(i, j)[0] > 0) {
              fullLabelImage.setPixelXY(
                i + annotation.boundingBox[0],
                j + annotation.boundingBox[1],
                categoryColor
              );
            }
          }
        }
      }
    });
    const blob = fullLabelImage.toBlob("image/png");
    zip.file(`${current.name}.png`, blob, {
      base64: true,
    });
  });
  zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
    saveAs(blob, "labeled_semantic.zip");
  });
};

export const saveAnnotationsAsLabelMatrix = (
  images: Array<ShadowImageType>,
  categories: Array<Category>,
  zip: any,
  random: boolean = false,
  binary: boolean = false
): Array<Promise<unknown>> => {
  return images
    .map((current: ShadowImageType) => {
      const height = current.shape.height;
      const width = current.shape.width;

      return categories.map((category: Category) => {
        return new Promise((resolve, reject) => {
          const fullLabelImage = new ImageJS.Image(
            width,
            height,
            new Uint8Array().fill(0),
            { components: 1, alpha: 0 }
          );
          let r = binary ? 255 : 1;
          let g = binary ? 255 : 1;
          let b = binary ? 255 : 1;
          for (let annotation of current.annotations) {
            if (random) {
              r = Math.round(Math.random() * 255);
              g = Math.round(Math.random() * 255);
              b = Math.round(Math.random() * 255);
            } else if (!binary) {
              r = r + 1;
              b = b + 1;
              g = g + 1;
            }
            if (annotation.categoryId !== category.id) continue;
            const decoded = decode(annotation.mask);
            const boundingBox = annotation.boundingBox;
            const endX = Math.min(width, boundingBox[2]);
            const endY = Math.min(height, boundingBox[3]);

            //extract bounding box params
            const boundingBoxWidth = endX - boundingBox[0];
            const boundingBoxHeight = endY - boundingBox[1];

            const roiMask = new ImageJS.Image(
              boundingBoxWidth,
              boundingBoxHeight,
              decoded,
              {
                components: 1,
                alpha: 0,
              }
            );
            for (let i = 0; i < boundingBoxWidth; i++) {
              for (let j = 0; j < boundingBoxHeight; j++) {
                if (roiMask.getPixelXY(i, j)[0] > 0) {
                  fullLabelImage.setPixelXY(
                    i + annotation.boundingBox[0],
                    j + annotation.boundingBox[1],
                    [r, g, b]
                  );
                }
              }
            }
          }
          const blob = fullLabelImage.toBlob("image/png");
          zip.folder(`${current.name}`);
          zip.file(`${current.name}/${category.name}.png`, blob, {
            base64: true,
          });
          resolve(true);
        });
      });
    })
    .flat();
};
