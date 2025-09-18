import { createSelector } from "@reduxjs/toolkit";
import {
  selectActiveTrackId,
  selectActiveImageId,
  selectActiveMetadata,
  selectMetadataStack,
  selectSelectedAnnotationIds,
  selectTimeTrackingRecord,
} from "./selectors";
import {
  selectAnnotationEntities,
  selectCategoryEntities,
  selectImageDataEntities,
  selectImageToAnnotations,
  selectMetadataEntities,
} from "store/data/selectors";
import { generateBlankColors } from "utils/tensorUtils";
import { ColorsRaw } from "utils/types";
import { DecodedAnnotationObject, GeneralizedKindItem } from "store/data/types";
import { normalizeImageToKindItem } from "store/data/utils";
import { ProtoAnnotationObject, ViewableAnnotationObject } from "../types";
import { decodeAnnotation } from "views/ImageViewer/utils/rle";

export const selectAllGeneralizedMetadataImages = createSelector(
  selectMetadataStack,
  selectImageDataEntities,
  selectMetadataEntities,
  (
    metadataStack,
    imageEntities,
    metadataEntities,
  ): Record<string, Record<string, GeneralizedKindItem>> => {
    const updatedMetadataImages: Record<
      string,
      Record<string, GeneralizedKindItem>
    > = {};

    for (const metadataId of Object.keys(metadataStack)) {
      const metadata = metadataEntities[metadataId];
      const updatedImages: Record<string, GeneralizedKindItem> = {};

      metadata.imageDataIds.forEach((imgId) => {
        const image = imageEntities[imgId];
        const finalImage: GeneralizedKindItem = {
          ...image,
          shape: metadata.shape,
          bitDepth: metadata.bitDepth,
          kind: metadata.kind,
          colors: image.colors,
        };
        updatedImages[imgId] = finalImage;
      });
      updatedMetadataImages[metadataId] = updatedImages;
    }

    return updatedMetadataImages;
  },
);

export const selectActiveImageRecord = createSelector(
  selectActiveMetadata,
  selectMetadataEntities,
  selectImageDataEntities,
  (
    activeMetadata,
    metadataEntities,
    imageDataEntities,
  ): Record<string, GeneralizedKindItem> => {
    if (!activeMetadata) return {};
    const metadata = metadataEntities[activeMetadata.id];
    return Object.keys(activeMetadata.images).reduce(
      (set: Record<string, GeneralizedKindItem>, id) => {
        set[id] = normalizeImageToKindItem(imageDataEntities[id], metadata);
        return set;
      },
      {},
    );
  },
);

export const selectActiveImage = createSelector(
  selectActiveMetadata,
  selectMetadataEntities,
  selectImageDataEntities,
  (
    activeMetadata,
    metadataEntities,
    imageDataEntities,
  ): GeneralizedKindItem | undefined => {
    if (!activeMetadata) return;
    const metadata = metadataEntities[activeMetadata?.id];
    const activeImageData = imageDataEntities[activeMetadata.activeImageId];
    return normalizeImageToKindItem(activeImageData, metadata);
  },
);
export const selectActiveImageRawColor = createSelector(
  selectActiveImage,
  (image): ColorsRaw => {
    if (!image) {
      return generateBlankColors(3);
    } else {
      return image.colors!;
    }
  },
);

export const selectActiveAnnotationIds = createSelector(
  selectActiveImage,
  selectImageToAnnotations,
  (activeImage, im2Anns) => (activeImage?.id ? im2Anns[activeImage.id] : []),
);

export const selectActiveAnnotationRecord = createSelector(
  selectActiveAnnotationIds,
  selectAnnotationEntities,
  (activeAnnIds, annotationEntities) => {
    return activeAnnIds.reduce(
      (activeAnns: Record<string, DecodedAnnotationObject>, id) => {
        const annotation = annotationEntities[id];
        const decodedAnnotation = decodeAnnotation(annotation);
        activeAnns[id] = decodedAnnotation;
        return activeAnns;
      },
      {},
    );
  },
);

export const selectActiveAnnotations = createSelector(
  selectActiveAnnotationRecord,
  (activeAnnotations) => Object.values(activeAnnotations),
);

export const selectAllImageViewerAnnotationRecord = createSelector(
  selectMetadataStack,
  selectImageToAnnotations,
  selectAnnotationEntities,
  (metadataStack, im2Ann, annEntities) => {
    const annotationObjects: Record<string, DecodedAnnotationObject> = {};
    Object.values(metadataStack).forEach((metadata) => {
      Object.keys(metadata.images).forEach((imId) => {
        im2Ann[imId].forEach((annId) => {
          annotationObjects[annId] = decodeAnnotation(annEntities[annId]);
        });
      });
    });
    return annotationObjects;
  },
);

export const selectAllImageViewerAnnotations = createSelector(
  selectAllImageViewerAnnotationRecord,
  (objects) => {
    return Object.values(objects);
  },
);

export const selectViewableActiveAnnotations = createSelector(
  selectActiveImage,
  selectActiveAnnotations,
  selectCategoryEntities,
  (activeImage, annotations, catDict): Array<ViewableAnnotationObject> => {
    if (!activeImage) return [];
    const imageShape = activeImage.shape;
    const viewableAnnotations: Array<ViewableAnnotationObject> = [];

    for (const annotation of annotations) {
      const fillColor = catDict[annotation.categoryId].color;
      viewableAnnotations.push({
        annotation: annotation as ProtoAnnotationObject,
        fillColor,
        imageShape: imageShape,
      });
    }
    return viewableAnnotations;
  },
);

export const selectSelectedActiveAnnotations = createSelector(
  [selectSelectedAnnotationIds, selectActiveAnnotationRecord],
  (annotationIds, annotations): Array<ProtoAnnotationObject> => {
    if (!annotationIds.length) return [];

    return annotationIds.map((annotationId) => {
      const annotation = annotations[annotationId] as ProtoAnnotationObject;
      return annotation;
    });
  },
);

export const selectSelectedActiveAnnotationIds = createSelector(
  selectSelectedActiveAnnotations,
  (selectedAnnotations): Array<string> =>
    selectedAnnotations.map((ann) => ann.id),
);

export const selectSelectedAnnotations = createSelector(
  selectSelectedAnnotationIds,
  selectAnnotationEntities,
  (selectedAnnotationIds, annotationEntities): ProtoAnnotationObject[] => {
    return selectedAnnotationIds.reduce((anns: ProtoAnnotationObject[], id) => {
      const ann = annotationEntities[id];
      if (ann) {
        anns.push(ann as ProtoAnnotationObject);
      }
      return anns;
    }, []);
  },
);

export const selectActiveTimeLinkedAnnId = createSelector(
  selectActiveImageId,
  selectActiveTrackId,
  selectTimeTrackingRecord,
  (activeImageId, activeTrackId, linkedIdRecord) => {
    if (!activeImageId || !activeTrackId) return undefined;
    return linkedIdRecord[activeTrackId][activeImageId];
  },
);
