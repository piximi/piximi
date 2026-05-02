import type { Thing } from "store/data/types";
import type {
  ExtendedAnnotationObject,
  ExtendedImageObject,
} from "store/dataV2/types";

import type { ThingSortKey } from "utils/enums";
import type { FilterType } from "utils/types";

export enum ImageSortType {
  None = "None",
  FileName = "File Name",
  Category = "Category",
  Random = "Random",
  Name = "Name",
}
export enum AnnotationSortType {
  None = "None",
  Plane = "Plane",
  Volume = "Volume",
  Category = "Category",
  Image = "Image",
  Random = "Random",
}
export type ImageFilters = Required<
  Pick<FilterType<ExtendedImageObject>, "categoryId" | "partition">
>;
export type ImageGridState = {
  selectedIds: string[];
  filters: ImageFilters;
  sortType: ImageSortType;
};

export type AnnotationFilters = Required<
  Pick<FilterType<ExtendedAnnotationObject>, "categoryId" | "partition">
>;
export type KindState = {
  id: string;
  name: string;
  selectedIds: string[];
  filters: AnnotationFilters;
  visible: boolean;
  sortType: AnnotationSortType;
};
export type AnnotationGridState = {
  activeKindId: string;
  kindStates: Record<string, KindState>;
};

export type ViewState = "images" | "annotations";
export type ProjectState = {
  name: string;
  activeView: ViewState;
  selectedThingIds: Array<string>;
  sortType: ThingSortKey;
  thingFilters: Record<
    string, // kind
    Required<Pick<FilterType<Thing>, "categoryId" | "partition">>
  >;
  imageGridState: ImageGridState;
  annotationGridState: AnnotationGridState;
  highlightedCategory: string | undefined;
  activeKind: string;
  kindTabFilters: string[];
  imageChannels: number | undefined;
};
