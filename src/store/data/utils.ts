import { v4 as uuidv4 } from "uuid";
import { union } from "lodash";
import IJSImage from "image-js";
import {
  tensor2d,
  image as tfImage,
  gather,
  Tensor4D,
  split as tfsplit,
} from "@tensorflow/tfjs";

import {
  ImageMetadata,
  FullTimepointImage,
  TPKey,
  GeneralizedKindItem,
  AnnotationObject,
  Category,
  Kind,
  ImageData,
} from "store/data/types";
import {
  IMAGE_KIND,
  UNKNOWN_CATEGORY_NAME,
  UNKNOWN_IMAGE_CATEGORY_COLOR,
} from "./constants";

import { DataState } from "store/types";
import { updateRecordArray } from "utils/objectUtils";

export const generateUUID = (options?: { definesUnknown: boolean }) => {
  const id = uuidv4();
  let unknownFlag: string;
  if (options?.definesUnknown) {
    unknownFlag = "0";
  } else {
    unknownFlag = "1";
  }
  return unknownFlag + id.slice(1);
};

export const isUnknownCategory = (categoryId: string) => {
  return categoryId[0] === "0";
};

const generateUnknownCategory = (kind: string) => {
  const unknownCategoryId = generateUUID({ definesUnknown: true });
  const unknownCategory: Category = {
    id: unknownCategoryId,
    name: UNKNOWN_CATEGORY_NAME,
    color: UNKNOWN_IMAGE_CATEGORY_COLOR,
    kind: kind,
    visible: true,
  };
  return unknownCategory;
};

export const generateCategory = (
  name: string,
  kindId: string,
  color: string,
): Category => {
  const id = generateUUID();
  return {
    name,
    id,
    kind: kindId,
    color,
    visible: true,
  };
};

export const generateKind = (kindName: string, useUUID?: boolean) => {
  const kindId = useUUID ? generateUUID() : kindName;
  const unknownCategory = generateUnknownCategory(kindId);
  const kind: Kind = {
    id: kindId,
    displayName: kindName,
    unknownCategoryId: unknownCategory.id,
  };
  return { kind, unknownCategory };
};

export const updateContents = (
  previousContents: string[],
  contents: string[],
  updateType: "add" | "remove" | "replace",
) => {
  let newContents: string[];

  switch (updateType) {
    case "add":
      newContents = union(previousContents, contents);
      break;
    case "remove":
      newContents = previousContents.filter((a) => !contents.includes(a));
      break;
    case "replace":
      newContents = contents;
  }
  return newContents;
};

export const getPropertiesFromImage = async (
  image: GeneralizedKindItem,
  annotation: { boundingBox: [number, number, number, number] },
) => {
  const renderedIm = await IJSImage.load(image.src);
  const normalizingWidth = image.shape.width - 1;
  const normalizingHeight = image.shape.height - 1;
  const bbox = annotation.boundingBox;
  const x1 = bbox[0] / normalizingWidth;
  const x2 = bbox[2] / normalizingWidth;
  const y1 = bbox[1] / normalizingHeight;
  const y2 = bbox[3] / normalizingHeight;
  const box = tensor2d([[y1, x1, y2, x2]]);
  const width = bbox[2] - bbox[0];
  const height = bbox[3] - bbox[1];
  const objectImage = renderedIm.crop({
    x: Math.abs(bbox[0]),
    y: Math.abs(bbox[1]),
    width: Math.abs(Math.min(image.shape.width, bbox[2]) - bbox[0]),
    height: Math.abs(Math.min(image.shape.height, bbox[3]) - bbox[1]),
  });
  const objSrc = objectImage.getCanvas().toDataURL();
  const data = tfImage.cropAndResize(image.data, box, [0], [height, width]);

  return {
    data: data,
    src: objSrc,
    imageId: image.id,
    boundingBox: bbox,
  };
};

export const getPropertiesFromImageSync = (
  renderedIm: IJSImage,
  image: GeneralizedKindItem,
  annotation: { boundingBox: number[] },
) => {
  const normalizingWidth = image.shape.width - 1;
  const normalizingHeight = image.shape.height - 1;
  const bbox = annotation.boundingBox;
  const x1 = bbox[0] / normalizingWidth;
  const x2 = bbox[2] / normalizingWidth;
  const y1 = bbox[1] / normalizingHeight;
  const y2 = bbox[3] / normalizingHeight;
  const box = tensor2d([[y1, x1, y2, x2]]);
  const width = bbox[2] - bbox[0];
  const height = bbox[3] - bbox[1];
  const objectImage = renderedIm.crop({
    x: Math.abs(bbox[0]),
    y: Math.abs(bbox[1]),
    width: Math.abs(Math.min(image.shape.width, bbox[2]) - bbox[0]),
    height: Math.abs(Math.min(image.shape.height, bbox[3]) - bbox[1]),
  });
  const objSrc = objectImage.getCanvas().toDataURL();
  const data = tfImage.cropAndResize(image.data, box, [0], [height, width]);
  box.dispose();

  return {
    data: data,
    src: objSrc,
    imageId: image.id,
    boundingBox: bbox as [number, number, number, number],
    bitDepth: image.bitDepth,
  };
};

export const extractTimepoint = (
  timeSeriesImage: ImageMetadata,
  timepoint: TPKey,
): FullTimepointImage => {
  const timePointData = timeSeriesImage.timepoints[timepoint];
  if (!timePointData) {
    throw new Error(
      `Time point ${timepoint} does not exist in image ${timeSeriesImage.id}`,
    );
  }
  return {
    id: timeSeriesImage.id,
    name: timeSeriesImage.name,
    kind: timeSeriesImage.kind,
    bitDepth: timeSeriesImage.bitDepth,
    partition: timeSeriesImage.partition,
    shape: timeSeriesImage.shape,
    src: timePointData.src,
    data: timePointData.data,
    colors: timePointData.colors,
    categoryId: timePointData.categoryId,
    activePlane: timePointData.activePlane,
    timepoint: timepoint,
  };
};

export const extractAllTimepoints = (
  imageSeries: ImageMetadata,
): FullTimepointImage[] => {
  const tpImages = Object.keys(imageSeries.timepoints).reduce(
    (tpImages: FullTimepointImage[], tp) => {
      tpImages.push(extractTimepoint(imageSeries, tp));
      return tpImages;
    },
    [],
  );
  return tpImages;
};
export const extractZPlane = (
  image: GeneralizedKindItem,
  plane: number,
): GeneralizedKindItem => {
  if (image.shape.planes === 1) return image;
  const planeData = gather(image.data, plane, 0).expandDims(0);

  return {
    id: image.id,
    name: image.name,
    kind: image.kind,
    bitDepth: image.bitDepth,
    partition: image.partition,
    shape: { ...image.shape, planes: 1 },
    src: image.src, //necessary to generate new source?
    data: planeData as Tensor4D,
    colors: image.colors,
    categoryId: image.categoryId,
    activePlane: plane,
    timepoint: image.timepoint,
  };
};
export const extractAllZPlanes = (
  image: GeneralizedKindItem,
): GeneralizedKindItem[] => {
  const planes = image.shape.planes;
  if (planes === 1) return [image];
  const planeData = tfsplit(image.data, planes, 0);

  const tzReducedImages = planeData.map((data, idx) => {
    return {
      id: image.id,
      name: image.name,
      kind: image.kind,
      bitDepth: image.bitDepth,
      containing: image.containing,
      partition: image.partition,
      shape: { ...image.shape, planes: 1 },
      src: image.src, //necessary to generate new source?
      data: data as Tensor4D,
      colors: image.colors,
      categoryId: image.categoryId,
      activePlane: idx,
      timepoint: image.timepoint,
    };
  });

  return tzReducedImages;
};

// /**
//  * Extracts all z-planes from a 3D image into separate `FullTimepointImage` objects,
//  * each representing a single plane. If the image contains only one plane,
//  * returns the original image in an array. Doesnt actually extract plane since
//  * extraction is done in the segmentation preprocessing.
//  *
//  * @param {FullTimepointImage} image - The source image containing multiple z-planes.
//  * @returns {FullTimepointImage[]} An array of images, each with one plane extracted
//  *                                  and `activePlane` set accordingly.
//  */
// export const extractAllZPlanes = (
//   image: GeneralizedKindItem,
// ): GeneralizedKindItem[] => {
//   const planes = image.shape.planes;
//   if (planes === 1) return [image];

//   const extractedPlanes: FullTimepointImage[] = [];

//   for (let i = 0; i < planes; i++) {
//     extractedPlanes.push({
//       id: image.id,
//       name: image.name,
//       kind: image.kind,
//       bitDepth: image.bitDepth,
//       partition: image.partition,
//       shape: { ...image.shape, planes: 1 },
//       src: image.src, //necessary to generate new source?
//       data: image.data,
//       colors: image.colors,
//       categoryId: image.categoryId,
//       activePlane: i,
//       timepoint: image.timepoint,
//     });
//   }

//   return extractedPlanes;
// };

export const getTZReducedImage = (
  timeSeriesImage: ImageMetadata,
  timepoint: TPKey,
  plane?: number,
): FullTimepointImage | FullTimepointImage => {
  const timePointData = timeSeriesImage.timepoints[timepoint];
  if (!timePointData) {
    throw new Error(
      `Time point ${timepoint} does not exist in image ${timeSeriesImage.id}`,
    );
  }
  const tzReducedImage = {
    id: timeSeriesImage.id,
    name: timeSeriesImage.name,
    kind: timeSeriesImage.kind,
    bitDepth: timeSeriesImage.bitDepth,
    partition: timeSeriesImage.partition,
    shape: timeSeriesImage.shape,
    src: timePointData.src,
    data: timePointData.data,
    colors: timePointData.colors,
    categoryId: timePointData.categoryId,
    activePlane: timePointData.activePlane,
    timepoint: timepoint,
  };

  if (plane) {
    const planeData = gather(tzReducedImage.data, plane, 0);
    tzReducedImage.data = planeData;
  }

  return tzReducedImage;
};

export const extractChannel = (
  image: GeneralizedKindItem,
  channel: number,
): GeneralizedKindItem => {
  const numChannels = image.shape.channels;
  if (channel >= numChannels)
    throw new Error(
      `Provided channel "${channel}" is larger than the number of channels in the image (${numChannels})`,
    );
  const channelData = gather(image.data, channel, 3).expandDims(-1);

  return {
    id: image.id,
    name: image.name,
    kind: image.kind,
    bitDepth: image.bitDepth,
    partition: image.partition,
    shape: { ...image.shape, channels: 1 },
    src: image.src, //necessary to generate new source?
    data: channelData as Tensor4D,
    colors: image.colors,
    categoryId: image.categoryId,
    activePlane: image.activePlane,
    timepoint: image.timepoint,
  };
};

const normalizeImageToKindItem = (
  image: ImageData,
  meta: ImageMetadata,
  timeExpanded: boolean,
): GeneralizedKindItem => {
  return {
    id: image.id,
    name: image.name,
    kind: IMAGE_KIND,
    categoryId: image.categoryId,
    colors: image.colors,
    boundingBox: undefined, // images don't have bounding boxes
    plane: image.activePlane,
    activePlane: image.activePlane,
    timepoint: image.timepoint,
    src: image.src,
    shape: meta.shape,
    bitDepth: meta.bitDepth,
    partition: image.partition,
    data: image.data,
    metadataId: meta.id,
    grouped: !timeExpanded,
  };
};

const normalizeAnnotationToKindItem = (
  annotation: AnnotationObject,
): GeneralizedKindItem => ({
  id: annotation.id,
  name: annotation.name,
  kind: annotation.kind,
  categoryId: annotation.categoryId,
  boundingBox: annotation.boundingBox,
  plane: annotation.plane,
  activePlane: annotation.activePlane ?? annotation.plane,
  timepoint: annotation.timepoint,
  src: annotation.src,
  shape: annotation.shape,
  bitDepth: annotation.bitDepth,
  partition: annotation.partition,
  childIds: annotation.childIds,
  data: annotation.data,
});

export const getKindItemsFromAnnotations = (
  annotations: AnnotationObject[],
) => {
  // Direct access to flat structure
  return annotations.reduce(
    (itemRecord: Record<string, GeneralizedKindItem>, ann) => {
      itemRecord[ann.id] = normalizeAnnotationToKindItem(ann);
      return itemRecord;
    },
    {},
  );
};

export const getKindItemsFromImages = (
  images: Record<string, ImageData>,
  metadataRecord: Record<string, ImageMetadata>,
  timeExpanded: boolean,
) => {
  if (!timeExpanded) {
    const defaultImages: Record<string, ImageData> = {};
    const metaGroupedImages = groupKindItemsBy(
      "metadataId",
      Object.values(images) as GeneralizedKindItem[],
    );
    for (const metaId in metaGroupedImages) {
      const defaultMetaImageId = metadataRecord[metaId].defaultImageId;
      defaultImages[defaultMetaImageId] = images[defaultMetaImageId];
    }
    images = defaultImages;
  }
  return Object.values(images).reduce(
    (itemRecord: Record<string, GeneralizedKindItem>, img) => {
      const meta = metadataRecord[img.metadataId];
      itemRecord[img.id] = normalizeImageToKindItem(img, meta, timeExpanded);
      return itemRecord;
    },
    {},
  );
};

export const groupKindItemsBy = (
  key: keyof GeneralizedKindItem,
  kindItems: GeneralizedKindItem[],
) => {
  return kindItems.reduce(
    (grouped: Record<string, GeneralizedKindItem[]>, kindItem) => {
      if (!kindItem[key]) return grouped;
      const value = kindItem[key];
      updateRecordArray(grouped, value as string, kindItem);
      return grouped;
    },
    {},
  );
};

export const generateDataRelationships = (
  kinds: Array<Kind>,
  categories: Array<Category>,
  images: Array<ImageData>,
  annotations: Array<AnnotationObject>,
) => {
  const relationships: DataState["relationships"] = {
    kindToCategories: {},
    kindToAnnotations: {},
    categoryToImages: {},
    categoryToAnnotations: {},
    imageToAnnotations: {},
  };
  kinds.forEach((kind) => {
    relationships.kindToCategories[kind.id] = [];
    if (kind.id !== IMAGE_KIND) relationships.kindToAnnotations[kind.id] = [];
  });
  categories.forEach((category) => {
    const categoryKind = category.kind;
    if (categoryKind === IMAGE_KIND) {
      relationships.categoryToImages[category.id] = [];
    } else {
      relationships.categoryToAnnotations[category.id] = [];
    }
    relationships.kindToCategories[categoryKind].push(category.id);
  });
  images.forEach((image) => {
    const imageCategory = image.categoryId;
    relationships.categoryToImages[imageCategory].push(image.id);
    relationships.imageToAnnotations[image.id] = [];
  });
  annotations.forEach((annotation) => {
    const annotationCategory = annotation.categoryId;
    const annotationKind = annotation.kind;
    const annotationImage = annotation.imageId;

    relationships.categoryToAnnotations[annotationCategory].push(annotation.id);
    relationships.kindToAnnotations[annotationKind].push(annotation.id);
    relationships.imageToAnnotations[annotationImage].push(annotation.id);
  });
  return relationships;
};
