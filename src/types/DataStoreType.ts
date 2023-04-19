import { EntityState } from "@reduxjs/toolkit";
import { Category } from "./Category";
import { AnnotationType, ImagesEntityType, stagedImageType } from "types";
import { StagedAnnotationType } from "./AnnotationType";
import { DeferredEntityState } from "store/entities";

type CatID = string;
type ImageID = string;
type AnnotationID = string;
type AnnotationCatID = string;
export type DataStoreSlice = {
  categories_: DeferredEntityState<Category>;
  annotationCategories_: DeferredEntityState<Category>;
  categories: {
    ids: Array<CatID>;
    entities: { [key: CatID]: Category };
  };
  annotationCategories: {
    ids: Array<AnnotationCatID>;
    entities: { [key: AnnotationCatID]: Category };
  };
  images: { ids: Array<ImageID>; entities: ImagesEntityType };
  stagedImages: EntityState<stagedImageType>;
  annotations: EntityState<AnnotationType>;
  stagedAnnotations: EntityState<StagedAnnotationType>;
  annotationsByImage: Record<ImageID, Array<AnnotationID>>;
  annotationsByCategory: Record<AnnotationCatID, Array<AnnotationID>>;
  imagesByCategory: Record<CatID, Array<ImageID>>;
};
