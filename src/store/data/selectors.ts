import { createSelector } from "@reduxjs/toolkit";

import {
  kindsAdapter,
  categoriesAdapter,
  imageDataAdapter,
  metadataAdapter,
  annotationsAdapter,
} from "./dataSlice";

import { DataState } from "store/types";
import { RootState } from "store/rootReducer";
import { IMAGE_KIND } from "./constants";
import {
  AnnotationObject,
  Category,
  GeneralizedKindItem,
  ImageData,
  ImageMetadata,
  Kind,
} from "./types";
import { getKindItemsFromImages } from "./utils";

const kindSelectors = kindsAdapter.getSelectors(
  (state: RootState) => state.data.kinds,
);
const categorySelectors = categoriesAdapter.getSelectors(
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

export const selectDataState = ({ data }: { data: DataState }) => data;

type DataEntityArray = {
  kinds: Kind[];
  categories: Category[];
  metadata: ImageMetadata[];
  images: ImageData[];
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
