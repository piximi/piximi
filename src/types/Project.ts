import { Category } from "./Category";
import { OldImageType } from "./ImageType";
import { ImageSortKeyType } from "./ImageSortType";
import { AnnotationsEntityType } from "./AnnotationsEntityType";

export type Project = {
  categories: Array<Category>;
  annotationCategories: Array<Category>;
  name: string;
  images: Array<OldImageType>;
  annotations: {
    ids: Array<string>;
    entries: AnnotationsEntityType;
  };
  imageSortKey: ImageSortKeyType;
  highlightedCategory: string | null;
};
