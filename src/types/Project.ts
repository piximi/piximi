import { Category } from "./Category";
import { ImageType } from "./ImageType";
import { ImageSortKeyType } from "./ImageSortType";

export type Project = {
  categories: Array<Category>;
  annotationCategories: Array<Category>;
  name: string;
  images: Array<ImageType>;
  imageSortKey: ImageSortKeyType;
  highlightedCategory: string | null;
};
