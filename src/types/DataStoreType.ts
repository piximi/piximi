import { EntityState } from "@reduxjs/toolkit";
import { Category } from "./Category";
import {
  AnnotationType,
  ImageType,
  ImagesEntityType,
  stagedImageType,
} from "types";
import { StagedAnnotationType } from "./AnnotationType";
import { DeferredEntityState } from "store/entities";

type CatID = string;
type ImageID = string;
type AnnotationID = string;
type AnnotationCatID = string;
export type DataStoreSlice = {
  annotationCategories: DeferredEntityState<Category>;
  categories: DeferredEntityState<Category>;
  images: { ids: Array<ImageID>; entities: ImagesEntityType };
  images_: DeferredEntityState<ImageType>;
  stagedImages: EntityState<stagedImageType>;
  annotations: EntityState<AnnotationType>;
  stagedAnnotations: EntityState<StagedAnnotationType>;
  annotationsByImage: Record<ImageID, Array<AnnotationID>>;
  annotationsByCategory: Record<AnnotationCatID, Array<AnnotationID>>;
  imagesByCategory: Record<CatID, Array<ImageID>>;
};
