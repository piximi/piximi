import { ImageGridTab } from "./ImageGridTab";
import { ImageSortKey } from "./ImageSortType";

export type Project = {
  name: string;
  selectedImageIds: Array<string>;
  imageSortKey: ImageSortKey;
  highlightedCategory: string | undefined;
  hiddenImageCategoryIds: string[];
  selectedAnnotationIds: string[];
  imageGridTab: ImageGridTab;
  loadPercent: number;
  loadMessage: string;
};
