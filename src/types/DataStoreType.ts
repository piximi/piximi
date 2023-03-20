import { EntityState } from "@reduxjs/toolkit";
import { Category } from "./Category";
import { EncodedAnnotationType, ImagesEntityType } from "types";

type CatID = string;
type ImageID = string;
type AnnotationID = string;
type AnnotationCatID = string;
export type DataStoreSlice = {
  categories: {
    ids: Array<CatID>;
    entities: { [key: CatID]: Category };
  };
  annotationCategories: {
    ids: Array<AnnotationCatID>;
    entities: { [key: AnnotationCatID]: Category };
  };

  images: { ids: Array<ImageID>; entities: ImagesEntityType };

  annotations: EntityState<EncodedAnnotationType>;
  lookup: Record<
    CatID,
    Record<ImageID, Record<AnnotationCatID, Array<AnnotationID>>>
  >;
};
