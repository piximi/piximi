import IJSImage from "image-js";
import { getPropertiesFromImage } from "store/data/utils";
import { convertToDataArray } from "utils/dataUtils";
import {
  AnnotationObject,
  DecodedAnnotationObject,
  Kind,
  PartialDecodedAnnotationObject,
  DataArray,
  GeneralizedKindItem,
} from "store/data/types";
import { encodeAnnotation } from "./rle";
import { AnnotationMode } from "./enums";
import { AnnotationTool } from "./tools";
import { generateUUID } from "store/data/utils";
import { ProtoAnnotationObject } from "../state/types";

/**
 * Checks if a point lies within an annotation bounding box
 * @param x x-coord of point
 * @param y y-coord of point
 * @param boundingBox Bounding box of annotation
 * @returns true if point lies within the bounding box, false otherwise
 */
export const isInBoundingBox = (
  x: number,
  y: number,
  boundingBox: [number, number, number, number],
) => {
  if (x < 0 || y < 0) return false;
  if (x >= boundingBox[2] - boundingBox[0]) return false;
  if (y >= boundingBox[3] - boundingBox[1]) return false;
  return true;
};

export const createProtoAnnotation = (
  partialAnnotation: Omit<PartialDecodedAnnotationObject, "id">,
  activeImage: GeneralizedKindItem,
  kindObject: Kind,
  existingNames: string[],
): ProtoAnnotationObject => {
  const bbox = partialAnnotation.boundingBox;

  const bitDepth = activeImage.bitDepth;

  //TODO: add suppoert for multiple planes
  const shape = {
    planes: 1,
    height: bbox[3] - bbox[1],
    width: bbox[2] - bbox[0],
    channels: activeImage.shape.channels,
  };

  let annotationName: string = `${activeImage.name}-${kindObject.id}_0`;
  let i = 1;
  while (existingNames.includes(annotationName)) {
    annotationName = annotationName.replace(/_(\d+)$/, `_${i}`);
    i++;
  }
  const annotationId = generateUUID();
  return {
    ...partialAnnotation,
    bitDepth,
    shape,
    name: annotationName,
    kind: kindObject.id,
    id: annotationId,
  };
};

export const createAnnotation = async (
  partialAnnotation: Omit<PartialDecodedAnnotationObject, "id">,
  activeImage: GeneralizedKindItem,
  kindObject: Kind,
  existingNames: string[],
) => {
  const bbox = partialAnnotation.boundingBox;

  const bitDepth = activeImage.bitDepth;
  const imageProperties = await getPropertiesFromImage(
    activeImage,
    partialAnnotation,
  );
  //TODO: add suppoert for multiple planes
  const shape = {
    planes: 1,
    height: bbox[3] - bbox[1],
    width: bbox[2] - bbox[0],
    channels: activeImage.shape.channels,
  };

  let annotationName: string = `${activeImage.name}-${kindObject.id}_0`;
  let i = 1;
  while (existingNames.includes(annotationName)) {
    annotationName = annotationName.replace(/_(\d+)$/, `_${i}`);
    i++;
  }
  const annotationId = generateUUID();
  return {
    ...partialAnnotation,
    ...imageProperties,
    bitDepth,
    shape,
    name: annotationName,
    kind: kindObject.id,
    id: annotationId,
  } as DecodedAnnotationObject;
};

export const editProtoAnnotation = async (
  workingAnnotation: ProtoAnnotationObject,
  annotationMode: AnnotationMode,
  annotationTool: AnnotationTool,
  activeImage: GeneralizedKindItem,
): Promise<ProtoAnnotationObject> => {
  let combinedMask, combinedBoundingBox;

  if (annotationMode === AnnotationMode.Add) {
    [combinedMask, combinedBoundingBox] = annotationTool.add(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else if (annotationMode === AnnotationMode.Subtract) {
    [combinedMask, combinedBoundingBox] = annotationTool.subtract(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else if (annotationMode === AnnotationMode.Intersect) {
    [combinedMask, combinedBoundingBox] = annotationTool.intersect(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else {
    return workingAnnotation;
  }

  annotationTool.decodedMask = combinedMask;
  annotationTool.boundingBox = combinedBoundingBox;

  const combinedSelectedAnnotation = {
    ...workingAnnotation,
    boundingBox: combinedBoundingBox,
    decodedMask: annotationTool.decodedMask,
  } as DecodedAnnotationObject;

  const annotation = encodeAnnotation(combinedSelectedAnnotation);

  //TODO: add suppoert for multiple planes
  const shape = {
    planes: 1,
    height: combinedBoundingBox[3] - combinedBoundingBox[1],
    width: combinedBoundingBox[2] - combinedBoundingBox[0],
    channels: activeImage.shape.channels,
  };

  return { ...annotation, shape } as ProtoAnnotationObject;
};

export const editAnnotation = async (
  workingAnnotation: DecodedAnnotationObject,
  annotationMode: AnnotationMode,
  annotationTool: AnnotationTool,
  activeImage: GeneralizedKindItem,
): Promise<AnnotationObject | DecodedAnnotationObject> => {
  let combinedMask, combinedBoundingBox;

  if (annotationMode === AnnotationMode.Add) {
    [combinedMask, combinedBoundingBox] = annotationTool.add(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else if (annotationMode === AnnotationMode.Subtract) {
    [combinedMask, combinedBoundingBox] = annotationTool.subtract(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else if (annotationMode === AnnotationMode.Intersect) {
    [combinedMask, combinedBoundingBox] = annotationTool.intersect(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else {
    return workingAnnotation;
  }

  annotationTool.decodedMask = combinedMask;
  annotationTool.boundingBox = combinedBoundingBox;

  const combinedSelectedAnnotation = {
    ...workingAnnotation,
    boundingBox: combinedBoundingBox,
    decodedMask: annotationTool.decodedMask,
  } as DecodedAnnotationObject;

  const annotation = encodeAnnotation(combinedSelectedAnnotation);
  const { data, src } = await getPropertiesFromImage(activeImage, annotation);

  //TODO: add suppoert for multiple planes
  const shape = {
    planes: 1,
    height: combinedBoundingBox[3] - combinedBoundingBox[1],
    width: combinedBoundingBox[2] - combinedBoundingBox[0],
    channels: activeImage.shape.channels,
  };

  return { ...annotation, data, src, shape } as AnnotationObject;
};

/**
 * Invert the selected annotation area
 * @param selectedMask
 * @param selectedBoundingBox
 * @returns Bounding box and encodedMask of the inverted annotation area
 */
export const invert = (
  selectedMask: DataArray,
  selectedBoundingBox: [number, number, number, number],
  imageWidth: number,
  imageHeight: number,
): [Uint8Array, [number, number, number, number]] => {
  const encodedMask = selectedMask;

  // Find min and max boundary points when computing the encodedMask.
  const invertedBoundingBox: [number, number, number, number] = [
    imageWidth,
    imageHeight,
    0,
    0,
  ];

  const invertedMask = new IJSImage(imageWidth, imageHeight, {
    components: 1,
    alpha: 0,
  });
  for (let x = 0; x < imageWidth; x++) {
    for (let y = 0; y < imageHeight; y++) {
      const x_encodedMask = x - selectedBoundingBox[0];
      const y_encodedMask = y - selectedBoundingBox[1];
      const value =
        encodedMask[
          x_encodedMask +
            y_encodedMask * (selectedBoundingBox[2] - selectedBoundingBox[0])
        ];
      if (
        value > 0 &&
        isInBoundingBox(x_encodedMask, y_encodedMask, selectedBoundingBox)
      ) {
        invertedMask.setPixelXY(x, y, [0]);
      } else {
        invertedMask.setPixelXY(x, y, [255]);
        if (x < invertedBoundingBox[0]) {
          invertedBoundingBox[0] = x;
        } else if (x > invertedBoundingBox[2]) {
          invertedBoundingBox[2] = x + 1;
        }
        if (y < invertedBoundingBox[1]) {
          invertedBoundingBox[1] = y;
        } else if (y > invertedBoundingBox[3]) {
          invertedBoundingBox[3] = y + 1;
        }
      }
    }
  }

  // Crop the encodedMask using the new bounding box.
  const croppedInvertedMask = invertedMask.crop({
    x: invertedBoundingBox[0],
    y: invertedBoundingBox[1],
    width: invertedBoundingBox[2] - invertedBoundingBox[0],
    height: invertedBoundingBox[3] - invertedBoundingBox[1],
  });

  return [
    convertToDataArray(8, croppedInvertedMask.data) as Uint8Array,
    invertedBoundingBox,
  ];
};
