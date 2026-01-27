import { createSelector } from "@reduxjs/toolkit";

import {
  kindsAdapter,
  categoriesAdapter,
  imageDataAdapter,
  metadataAdapter,
  annotationsAdapter,
  trackletAdapter,
} from "./dataSlice";

import { DataState } from "store/types";
import { RootState } from "store/rootReducer";
import { IMAGE_KIND } from "./constants";
import {
  AnnotationObject,
  Category,
  GeneralizedKindItem,
  ImageObject,
  ImageMetadata,
  Kind,
  Tracklet,
} from "./types";
import { getKindItemsFromImages } from "./utils";

export const kindSelectors = kindsAdapter.getSelectors(
  (state: RootState) => state.data.kinds,
);
export const categorySelectors = categoriesAdapter.getSelectors(
  (state: RootState) => state.data.categories,
);

export const metadataSelectors = metadataAdapter.getSelectors(
  (state: RootState) => state.data.metadata,
);
export const imageDataSelectors = imageDataAdapter.getSelectors(
  (state: RootState) => state.data.images,
);
export const annotationSelectors = annotationsAdapter.getSelectors(
  (state: RootState) => state.data.annotations,
);
export const trackletSelectors = trackletAdapter.getSelectors(
  (state: RootState) => state.data.tracklets,
);

export const selectKindEntities = kindSelectors.selectEntities; // returns kinds dict
export const selectAllKinds = kindSelectors.selectAll; // returns an array
export const selectAllKindIds = kindSelectors.selectIds;
export const selectKindCount = kindSelectors.selectTotal;

export const selectCategoryEntities = categorySelectors.selectEntities;
export const selectAllCategories = categorySelectors.selectAll;
export const selectCategoryIds = categorySelectors.selectIds;
export const selectCategoryCount = categorySelectors.selectTotal;

export const selectMetadataEntities = metadataSelectors.selectEntities;
export const selectAllMetadata = metadataSelectors.selectAll;
export const selectMetadataIds = metadataSelectors.selectIds;
export const selectMetadataCount = metadataSelectors.selectTotal;

export const selectImageDataEntities = imageDataSelectors.selectEntities;
export const selectAllImageData = imageDataSelectors.selectAll;
export const selectImageDataIds = imageDataSelectors.selectIds;
export const selectImageDataCount = imageDataSelectors.selectTotal;

export const selectAnnotationEntities = annotationSelectors.selectEntities;
export const selectAllAnnotations = annotationSelectors.selectAll;
export const selectAnotationIds = annotationSelectors.selectIds;
export const selectAnnotationCount = annotationSelectors.selectTotal;

export const selectTrackletEntities = trackletSelectors.selectEntities;
export const selectAllTracklets = trackletSelectors.selectAll;
export const selectTrackletIds = trackletSelectors.selectIds;
export const selectTrackletCount = trackletSelectors.selectTotal;

export const selectDataState = ({ data }: { data: DataState }) => data;

type DataEntityArray = {
  kinds: Kind[];
  categories: Category[];
  metadata: ImageMetadata[];
  images: ImageObject[];
  annotations: AnnotationObject[];
};
export const selectDataArrays = createSelector(
  selectDataState,
  (data): DataEntityArray => ({
    kinds: Object.values(data.kinds.entities),
    categories: Object.values(data.categories.entities),
    images: Object.values(data.images.entities),
    metadata: Object.values(data.metadata.entities),
    annotations: Object.values(data.annotations.entities),
  }),
);

export const selectUnknownImageCategory = ({ data }: { data: DataState }) =>
  data.kinds.entities[IMAGE_KIND]?.unknownCategoryId;

export const selectKindToCategories = ({ data }: { data: DataState }) =>
  data.relationships.kindToCategories;
export const selectKindToAnnotations = ({ data }: { data: DataState }) =>
  data.relationships.kindToAnnotations;
export const selectCategoryToImages = ({ data }: { data: DataState }) =>
  data.relationships.categoryToImages;
export const selectCategoryToAnnotations = ({ data }: { data: DataState }) =>
  data.relationships.categoryToAnnotations;
export const selectImageToAnnotations = ({ data }: { data: DataState }) =>
  data.relationships.imageToAnnotations;
export const selectMetadataToTracklets = ({ data }: { data: DataState }) =>
  data.relationships.metadataToTracklets;

export const selectImageCategories = createSelector(
  selectCategoryEntities,
  selectKindToCategories,
  (catEntities, k2C) => k2C[IMAGE_KIND].map((id) => catEntities[id]),
);
export const selectCategoryToAllItems = createSelector(
  selectCategoryToAnnotations,
  selectCategoryToImages,
  (cat2Ann, cat2Im) => {
    return { ...cat2Ann, ...cat2Im };
  },
);
export const selectKindToCategoryEntities = createSelector(
  selectKindToCategories,
  selectCategoryEntities,
  (kind2Cat, categoryEntities) => {
    return Object.keys(kind2Cat).reduce(
      (kind2CatEnt: Record<string, Category[]>, kindId) => {
        kind2CatEnt[kindId] = kind2Cat[kindId].map(
          (id) => categoryEntities[id],
        );
        return kind2CatEnt;
      },
      {},
    );
  },
);
export const selectKindToAnnotationCategoryEntities = createSelector(
  selectKindToCategories,
  selectCategoryEntities,
  (kind2Cat, categoryEntities) => {
    return Object.keys(kind2Cat).reduce(
      (kind2CatEnt: Record<string, Category[]>, kindId) => {
        if (kindId === IMAGE_KIND) return kind2CatEnt;
        kind2CatEnt[kindId] = kind2Cat[kindId].map(
          (id) => categoryEntities[id],
        );
        return kind2CatEnt;
      },
      {},
    );
  },
);
export const selectMetadataToAnnotationIds = createSelector(
  selectMetadataEntities,
  selectImageToAnnotations,
  (metadataEntities, im2Anns) => {
    return Object.values(metadataEntities).reduce(
      (m2a: Record<string, string[]>, mId) => {
        m2a[mId.id] = mId.imageDataIds.reduce((annIds: string[], imId) => {
          annIds.push(...im2Anns[imId]);
          return annIds;
        }, []);
        return m2a;
      },
      {},
    );
  },
);
export const selectMetadataToAnnotationEntities = createSelector(
  selectMetadataEntities,
  selectImageToAnnotations,
  selectAnnotationEntities,
  (metadataEntities, im2Anns, annEntities) => {
    return Object.values(metadataEntities).reduce(
      (m2a: Record<string, AnnotationObject[]>, mId) => {
        m2a[mId.id] = mId.imageDataIds.reduce(
          (anns: AnnotationObject[], imId) => {
            anns.push(...im2Anns[imId].map((annId) => annEntities[annId]));
            return anns;
          },
          [],
        );
        return m2a;
      },
      {},
    );
  },
);

export const selectGetKindDisplayName = createSelector(
  selectKindEntities,
  (kindEntities) => (kindId: string) => kindEntities[kindId].displayName,
);

export const selectGeneralizedImagesRecord = createSelector(
  selectMetadataEntities,
  selectImageDataEntities,
  (metadataEntities, imageEntities): Record<string, GeneralizedKindItem> =>
    getKindItemsFromImages(imageEntities, metadataEntities, true),
);

export const selectGeneralizedImageArray = createSelector(
  selectGeneralizedImagesRecord,
  (generalizedImageRecord): GeneralizedKindItem[] =>
    Object.values(generalizedImageRecord),
);

export const selectTrackletRecordByMetadata = createSelector(
  selectMetadataToTracklets,
  selectTrackletEntities,
  (meta2Tracklet, trackletRecord) => {
    return Object.entries(meta2Tracklet).reduce(
      (
        m2t: Record<string, Record<string, Tracklet>>,
        [metadataId, trackletIds],
      ) => {
        m2t[metadataId] = {};
        trackletIds.forEach((id) => (m2t[metadataId][id] = trackletRecord[id]));
        return m2t;
      },
      {},
    );
  },
);

export const selectAnnotationEntitiesByTracklet = createSelector(
  selectTrackletEntities,
  selectAnnotationEntities,
  (trackletEntities, annEntities) => (trackletId: string) => {
    const tracklet = trackletEntities[trackletId];
    if (!tracklet) {
      console.error(`No tracklet with id "${trackletId}".`);
      return [];
    }
    const annIds = tracklet.linkedIds;
    return annIds.map((annId) => annEntities[annId]);
  },
);
