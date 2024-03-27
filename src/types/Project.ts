import { AnnotationType } from "./AnnotationType";
import { ImageGridTab } from "./ImageGridTab";
import { ImageSortKey, ThingSortKey_new } from "./ImageSortType";
import { ImageType } from "./ImageType";
import { FilterType } from "./utility/FilterType";

export type Project = {
  name: string;
  selectedImageIds: Array<string>;
  selectedThingIds: Array<string>;
  imageSortKey: ImageSortKey;
  sortType_new: ThingSortKey_new;
  imageFilters: Required<
    Pick<FilterType<ImageType>, "categoryId" | "partition">
  >;
  thingFilters: Record<
    string,
    Required<Pick<FilterType<ImageType>, "categoryId" | "partition">>
  >;
  annotationFilters: Required<Pick<FilterType<AnnotationType>, "categoryId">>;
  highlightedCategory: string | undefined;
  selectedAnnotationIds: string[];
  imageGridTab: ImageGridTab;
  activeKind: string;
  loadPercent: number;
  loadMessage: string;
};
