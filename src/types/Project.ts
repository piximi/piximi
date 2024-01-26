import { AnnotationType } from "./AnnotationType";
import { ImageGridTab } from "./ImageGridTab";
import { ImageSortKey } from "./ImageSortType";
import { ImageType } from "./ImageType";
import { FilterType } from "./utility/FilterType";

export type Project = {
  name: string;
  selectedImageIds: Array<string>;
  imageSortKey: ImageSortKey;
  imageFilters: Required<
    Pick<FilterType<ImageType>, "categoryId" | "partition">
  >;
  annotationFilters: Required<Pick<FilterType<AnnotationType>, "categoryId">>;
  highlightedCategory: string | undefined;
  selectedAnnotationIds: string[];
  imageGridTab: ImageGridTab;
  activeKind: string;
  loadPercent: number;
  loadMessage: string;
};
