import { EntityState } from "@reduxjs/toolkit";
import { Category } from "./Category";
import { AnnotationType, ImageType } from "types";
import { StagedAnnotationType } from "./AnnotationType";
import { DeferredEntityState } from "store/entities";

type CatID = string;
type ImageID = string;
type AnnotationID = string;
type AnnotationCatID = string;
export type DataStoreSlice = {
  annotationCategories: DeferredEntityState<Category>;
  categories: DeferredEntityState<Category>;
  images: DeferredEntityState<ImageType>;
  annotations: EntityState<AnnotationType>;
  stagedAnnotations: EntityState<StagedAnnotationType>;
  annotationsByImage: Record<ImageID, Array<AnnotationID>>;
  annotationsByCategory: Record<AnnotationCatID, Array<AnnotationID>>;
  imagesByCategory: Record<CatID, Array<ImageID>>;
};
