import * as _ from "lodash";
import * as ImageJS from "image-js";
import { AnnotationType } from "../types/AnnotationType";
import { decode } from "./rle";
import { isoLines } from "marchingsquares";
import { CategoryType } from "../types/CategoryType";
import { ImageType } from "../types/ImageType";
import { SerializedAnnotationType } from "../types/SerializedAnnotationType";
import { saveAs } from "file-saver";

export const connectPoints = (
  coordinates: Array<Array<number>>,
  image: ImageJS.Image
) => {
  let connectedPoints: Array<Array<number>> = [];

  const foo = _.filter(
    _.zip(coordinates.slice(0, coordinates.length - 1), coordinates.slice(1)),
    ([current, next]) => {
      return !_.isEqual(current, next);
    }
  );
  foo.forEach(([current, next]) => {
    const points = drawLine(current!, next!);
    connectedPoints = _.concat(connectedPoints, points);
  });
  return connectedPoints;
};

export const drawLine = (p: Array<number>, q: Array<number>) => {
  const coords: Array<Array<number>> = [];

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

  x1 = Math.round(p[0]);
  y1 = Math.round(p[1]);
  x2 = Math.round(q[0]);
  y2 = Math.round(q[1]);

  dx = x2 - x1;
  dy = y2 - y1;

  step = Math.abs(dy);

  if (Math.abs(dx) >= Math.abs(dy)) {
    step = Math.abs(dx);
  }

  dx = dx / step;
  dy = dy / step;
  x = x1;
  y = y1;
  i = 1;

  while (i <= step) {
    coords.push([Math.round(x), Math.round(y)]);
    x = x + dx;
    y = y + dy;
    i = i + 1;
  }

  return coords;
};

export const getIdx = (width: number, nchannels: number) => {
  return (x: number, y: number, index: number) => {
    index = index || 0;
    return Math.floor((width * y + x) * nchannels + index);
  };
};

/*
Given a click at a position, return all overlapping annotations ids
 */
export const getOverlappingAnnotations = (
  position: { x: number; y: number },
  annotations: Array<AnnotationType>,
  imageWidth: number,
  imageHeight: number
) => {
  const overlappingAnnotations = annotations.filter(
    (annotation: AnnotationType) => {
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
            decode(annotation.mask),
            { components: 1, alpha: 0 }
          );
          if (
            maskROI.getPixelXY(
              Math.round(position.x - boundingBox[0]),
              Math.round(position.y - boundingBox[1])
            )[0]
          )
            return annotation;
        }
      }
    }
  );
  return overlappingAnnotations.map((annotation: AnnotationType) => {
    return annotation.id;
  });
};

export const getAnnotationsInBox = (
  minimum: { x: number; y: number },
  maximum: { x: number; y: number },
  annotations: Array<AnnotationType>
) => {
  return annotations.filter((annotation: AnnotationType) => {
    return (
      minimum.x <= annotation.boundingBox[0] &&
      minimum.y <= annotation.boundingBox[1] &&
      maximum.x >= annotation.boundingBox[2] &&
      maximum.y >= annotation.boundingBox[3]
    );
  });
};

export const computeContoursFromIsolines = (
  data: Array<Array<number>>
): Array<number> => {
  //pad array to obtain better estimate of contours around mask
  const pad = 10;
  const padY = new Array(data[0].length + 2 * pad).fill(0);
  const padX = new Array(pad).fill(0);

  const paddedMatrix: Array<Array<number>> = [];

  let i;
  for (i = 0; i < pad; i++) {
    paddedMatrix.push(padY);
  }
  data.forEach((row: Array<number>) => {
    paddedMatrix.push(padX.concat(row).concat(padX));
  });
  for (i = 0; i < pad; i++) {
    paddedMatrix.push(padY);
  }

  const largestIsolines = isoLines(paddedMatrix, 1).sort(
    (a: Array<number>, b: Array<number>) => {
      return b.length - a.length;
    }
  );

  let largestIsoline = largestIsolines[0];

  if (largestIsoline.length <= 5) return [];

  return _.flatten(
    largestIsoline.map((coord: Array<number>) => {
      return [Math.round(coord[0] - pad), Math.round(coord[1] - pad)];
    })
  );
};

/*
 * From encoded mask data, get the decoded data and return results as an HTMLImageElement to be used by Konva.Image
 */
export const colorOverlayROI = (
  encodedMask: Array<number>,
  boundingBox: [number, number, number, number],
  imageWidth: number,
  imageHeight: number,
  color: Array<number>
): HTMLImageElement | undefined => {
  if (!encodedMask) return undefined;

  const decodedData = decode(encodedMask);

  const endX = Math.min(imageWidth, boundingBox[2]);
  const endY = Math.min(imageHeight, boundingBox[3]);

  //extract bounding box params
  const boxWidth = endX - boundingBox[0];
  const boxHeight = endY - boundingBox[1];

  if (!boxWidth || !boxHeight) return undefined;

  const croppedImage = new ImageJS.Image(boxWidth, boxHeight, decodedData, {
    components: 1,
    alpha: 0,
  });

  const colorROIImage = new ImageJS.Image(boxWidth, boxHeight, {
    components: 3,
    alpha: 1,
  });

  const checkNeighbors = (
    arr: ImageJS.Image,
    x: number,
    y: number
  ): boolean => {
    if (x === 0 || x === boxWidth - 1) return true;
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
 * Method to rename a cateogry/image if a category/image with this name already exists
 * */
export const replaceDuplicateName = (name: string, names: Array<string>) => {
  let currentName = name;
  let i = 1;
  while (names.includes(currentName)) {
    currentName = name + `_${i}`;
    i += 1;
  }
  return currentName;
};

/*
 * from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
 * */
const hexToRgb = (hex: string) => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const saveAnnotationsAsBinaryInstanceSegmentationMasks = (
  images: Array<ImageType>,
  categories: Array<CategoryType>,
  zip: any
): any => {
  images.forEach((current: ImageType) => {
    current.annotations.forEach((annotation: AnnotationType) => {
      const fullLabelImage = new ImageJS.Image(
        current.shape.width,
        current.shape.height,
        new Uint8Array().fill(0),
        { components: 1, alpha: 0 }
      );
      const encoded = annotation.mask;
      const decoded = decode(encoded);
      const boundingBox = annotation.boundingBox;
      const endX = Math.min(current.shape.width, boundingBox[2]);
      const endY = Math.min(current.shape.height, boundingBox[3]);

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
      const category = categories.find((category: CategoryType) => {
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
  images: Array<ImageType>,
  categories: Array<CategoryType>,
  zip: any
): any => {
  images.forEach((current: ImageType) => {
    const fullLabelImage = new ImageJS.Image(
      current.shape.width,
      current.shape.height,
      new Uint8Array().fill(0),
      { components: 1, alpha: 0 }
    );
    categories.forEach((category: CategoryType) => {
      const categoryColor = hexToRgb(category.color);
      if (!categoryColor) return;

      for (let annotation of current.annotations) {
        if (annotation.categoryId !== category.id) continue;
        const encoded = annotation.mask;
        const decoded = decode(encoded);
        const boundingBox = annotation.boundingBox;
        const endX = Math.min(current.shape.width, boundingBox[2]);
        const endY = Math.min(current.shape.height, boundingBox[3]);

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
                [categoryColor.r, categoryColor.g, categoryColor.b]
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
  images: Array<ImageType>,
  categories: Array<CategoryType>,
  zip: any,
  random: boolean = false,
  binary: boolean = false
): Array<Promise<unknown>> => {
  return images
    .map((current: ImageType) => {
      return categories.map((category: CategoryType) => {
        return new Promise((resolve, reject) => {
          const fullLabelImage = new ImageJS.Image(
            current.shape.width,
            current.shape.height,
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
            const encoded = annotation.mask;
            const decoded = decode(encoded);
            const boundingBox = annotation.boundingBox;
            const endX = Math.min(current.shape.width, boundingBox[2]);
            const endY = Math.min(current.shape.height, boundingBox[3]);

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

export const importSerializedAnnotations = (
  annotation: SerializedAnnotationType,
  existingCategories: Array<CategoryType>
): { annotation_out: AnnotationType; categories: Array<CategoryType> } => {
  const mask = annotation.annotationMask
    .split(" ")
    .map((x: string) => parseInt(x));

  let newCategories = existingCategories;
  //if category does not already exist in state, add it
  if (
    !existingCategories
      .map((category: CategoryType) => category.id)
      .includes(annotation.annotationCategoryId)
  ) {
    const category: CategoryType = {
      color: annotation.annotationCategoryColor,
      id: annotation.annotationCategoryId,
      name: annotation.annotationCategoryName,
      visible: true,
    };
    newCategories = [...newCategories, category];
  }

  return {
    annotation_out: {
      boundingBox: [
        annotation.annotationBoundingBoxX,
        annotation.annotationBoundingBoxY,
        annotation.annotationBoundingBoxWidth,
        annotation.annotationBoundingBoxHeight,
      ],
      categoryId: annotation.annotationCategoryId,
      id: annotation.annotationId,
      mask: mask,
    },
    categories: newCategories,
  };
};
