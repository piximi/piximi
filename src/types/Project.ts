import { ImageSortKeyType } from "./ImageSortType";

export type Project = {
  name: string;
  selectedImageIds: Array<string>;
  imageSortKey: ImageSortKeyType;
  highlightedCategory: string | null;
};
