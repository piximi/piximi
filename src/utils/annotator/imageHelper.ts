import * as ImageJS from "image-js";
import { saveAs } from "file-saver";
import JSZip from "jszip";

import { DataArray } from "../common/image/imageHelper";
import { decode } from "./rle/rle";
import { pointsAreEqual } from "./point-operations/point-operations";

import {
  AnnotationType,
  DecodedAnnotationType,
  Category,
  Point,
  ImageType,
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
  annotations: Array<DecodedAnnotationType>
) => {
  const overlappingAnnotations = annotations.filter(
    (annotation: DecodedAnnotationType) => {
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
            annotation.decodedMask,
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
  return overlappingAnnotations.map((annotation: DecodedAnnotationType) => {
    return annotation.id;
  });
};

export const getAnnotationsInBox = (
  minimum: { x: number; y: number },
  maximum: { x: number; y: number },
  annotations: Array<DecodedAnnotationType>
) => {
  return annotations.filter((annotation: DecodedAnnotationType) => {
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
  scalingFactor: number
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
  let croppedImage = new ImageJS.Image(
    boxWidth,
    boxHeight,
    Array(boxHeight * boxWidth).fill(0),
    {
      components: 1,
      alpha: 0,
    }
  ).resize({ factor: scalingFactor });
  try {
    croppedImage = new ImageJS.Image(boxWidth, boxHeight, decodedMask, {
      components: 1,
      alpha: 0,
    }).resize({ factor: scalingFactor });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`boundingbox: ${boundingBox}`);
      console.log(`boxWidth: ${boxWidth}`);
      console.log(`boxHeight: ${boxHeight}`);
      console.log(`bwxbh: ${boxHeight * boxWidth}`);
      console.log(`decodedMask length: ${decodedMask.length}`);
      console.log(`diff: ${boxHeight * boxWidth - decodedMask.length}`);
      console.log(err);
    }
  }

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
  images: Array<ImageType>,
  annotations: Array<AnnotationType>,
  categories: Array<Category>,
  zip: any,
  projectName: string
): any => {
  // imageId -> list of annotations it owns
  const annsByImId = annotations.reduce((idMap, ann) => {
    if (idMap[ann.imageId]) {
      idMap[ann.imageId].push(ann);
    } else {
      idMap[ann.imageId] = [ann];
    }
    return idMap;
  }, {} as { [imageId: string]: AnnotationType[] });

  images.forEach((current) => {
    annsByImId[current.id].forEach((ann) => {
      const height = current.shape.height;
      const width = current.shape.width;

      const fullLabelImage = new ImageJS.Image(
        width,
        height,
        new Uint8Array().fill(0),
        {
          components: 1,
          alpha: 0,
        }
      );
      const decoded = decode(ann.encodedMask!);
      const boundingBox = ann.boundingBox;
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
              i + ann.boundingBox[0],
              j + ann.boundingBox[1],
              [255, 255, 255]
            );
          }
        }
      }
      const blob = fullLabelImage.toBlob("image/png");
      const category = categories.find((category: Category) => {
        return category.id === ann.categoryId;
      });
      if (category) {
        zip.folder(`${current.name}/${category.name}`);
        zip.file(`${current.name}/${category.name}/${ann.id}.png`, blob, {
          base64: true,
        });
      }
    });
  });
  zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
    saveAs(blob, `${projectName}.zip`);
  });
};

export const saveAnnotationsAsLabeledSemanticSegmentationMasks = (
  images: Array<ImageType>,
  annotations: Array<AnnotationType>,
  categories: Array<Category>,
  zip: any,
  projectName: string
): any => {
  // imageId -> list of annotations it owns
  const annsByImId = annotations.reduce((idMap, ann) => {
    if (idMap[ann.imageId]) {
      idMap[ann.imageId].push(ann);
    } else {
      idMap[ann.imageId] = [ann];
    }
    return idMap;
  }, {} as { [imageId: string]: AnnotationType[] });

  images.forEach((current) => {
    const height = current.shape.height;
    const width = current.shape.width;

    const fullLabelImage = new ImageJS.Image(
      width,
      height,
      new Uint8Array().fill(0),
      {
        components: 1,
        alpha: 0,
      }
    );
    categories.forEach((category: Category) => {
      const categoryColor = hexToRGBA(category.color);
      if (!categoryColor) return;

      for (let ann of annsByImId[current.id]) {
        if (ann.categoryId !== category.id) continue;
        const decoded = decode(ann.encodedMask!);
        const boundingBox = ann.boundingBox;
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
                i + ann.boundingBox[0],
                j + ann.boundingBox[1],
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
    saveAs(blob, `${projectName}.zip`);
  });
};

export const saveAnnotationsAsLabelMatrix = async (
  images: Array<ImageType>,
  annotations: Array<AnnotationType>,
  categories: Array<Category>,
  zip: JSZip,
  random: boolean = false,
  binary: boolean = false
) => {
  // image id -> image
  const imIdMap = images.reduce(
    (idMap, im) => ({ ...idMap, [im.id]: im }),
    {} as { [internalImageId: string]: ImageType }
  );

  // cat id -> cat name
  const catIdMap = categories.reduce(
    (idMap, cat) => ({ ...idMap, [cat.id]: cat.name }),
    {} as { [internalCategoryId: string]: string }
  );

  // image name -> cat name -> annotations
  const annIdMap = {} as {
    [imName: string]: { [catName: string]: AnnotationType[] };
  };

  for (const ann of annotations) {
    const im = imIdMap[ann.imageId];
    const catName = catIdMap[ann.categoryId];

    if (!annIdMap.hasOwnProperty(im.name)) {
      annIdMap[im.name] = {};
    }

    if (!annIdMap[im.name].hasOwnProperty(catName)) {
      annIdMap[im.name][catName] = [];
    }

    annIdMap[im.name][catName].push(ann);
  }

  for (const im of images) {
    // for image names like blah.png
    const imCleanName = im.name.split(".")[0];

    for (const cat of categories) {
      const fullLabelImage = new ImageJS.Image(
        im.shape.width,
        im.shape.height,
        new Uint8Array().fill(0),
        { components: 1, alpha: 0 }
      );

      let r = binary ? 255 : 1;
      let g = binary ? 255 : 1;
      let b = binary ? 255 : 1;

      const imCatAnns = annIdMap[im.name][cat.name];

      // no annotations for this category, in this image
      if (!imCatAnns) continue;

      for (const ann of imCatAnns) {
        if (random) {
          r = Math.round(Math.random() * 255);
          g = Math.round(Math.random() * 255);
          b = Math.round(Math.random() * 255);
        } else if (!binary) {
          r = r + 1;
          b = b + 1;
          g = g + 1;
        }

        const decoded = decode(ann.encodedMask);
        const boundingBox = ann.boundingBox;
        const endX = Math.min(im.shape.width, boundingBox[2]);
        const endY = Math.min(im.shape.height, boundingBox[3]);

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
                i + ann.boundingBox[0],
                j + ann.boundingBox[1],
                [r, g, b]
              );
            }
          }
        }
      }

      const imCatBlob = await fullLabelImage.toBlob("image/png");
      zip.folder(`${imCleanName}`);
      zip.file(`${imCleanName}/${cat.name}.png`, imCatBlob, { base64: true });
    }
  }
};
