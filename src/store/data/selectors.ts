import { createSelector } from "@reduxjs/toolkit";
import { intersection } from "lodash";

import {
  kindsAdapter,
  categoriesAdapter,
  imageDataAdapter,
  metadataAdapter,
  annotationsAdapter,
} from "./dataSlice";

import {
  Category,
  FullTimepointImage,
  ImageMetadata,
  Kind,
  TPKey,
  AnnotationObject,
} from "./types";
import { DataState } from "store/types";
import { updateRecordArray } from "utils/objectUtils";
import { extractTimepoint } from "./utils";
import { RootState } from "store/rootReducer";
import { IMAGE_KIND } from "./constants";

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
export const selectDataEntries = createSelector(selectDataState, (data) => ({
  kinds: Object.values(data.kinds),
  categories: Object.values(data.categories),
  images: Object.values(data.images),
  metadata: Object.values(data.metadata),
  annotations: Object.values(data.annotations),
}));

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
export const selectCategoryToAllItems = createSelector(
  selectCategoryToAnnotations,
  selectCategoryToImages,
  (cat2Ann, cat2Im) => {
    return { ...cat2Ann, ...cat2Im };
  },
);

export const selectGetKindDisplayName = createSelector(
  selectKindEntities,
  (kindEntities) => (kindId: string) => kindEntities[kindId].displayName,
);

/*
  KINDS
*/
