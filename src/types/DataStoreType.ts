import { Category } from "./Category";
import { AnnotationType, ImageType } from "types";
import { DeferredEntityState } from "store/entities";

type CatID = string;
type ImageID = string;
type AnnotationID = string;
type AnnotationCatID = string;
export type DataStoreSlice = {
  annotationCategories: DeferredEntityState<Category>;
  categories: DeferredEntityState<Category>;
  images: DeferredEntityState<ImageType>;
  annotations: DeferredEntityState<AnnotationType>;
  annotationsByImage: Record<ImageID, Array<AnnotationID>>;
  annotationsByCategory: Record<AnnotationCatID, Array<AnnotationID>>;
  imagesByCategory: Record<CatID, Array<ImageID>>;
};
