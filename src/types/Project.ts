import { ImageSortKey } from "./ImageSortType";

export type Project = {
  name: string;
  selectedImageIds: Array<string>;
  imageSortKey: ImageSortKey;
  highlightedCategory: string | null;
  hiddenImageCategoryIds: string[];
};
