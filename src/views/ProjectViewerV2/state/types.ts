import { Thing } from "store/data/types";
import { ExtendedAnnotationObject, ImageObject } from "store/dataV2/types";
import { ThingSortKey } from "utils/enums";
import { FilterType } from "utils/types";

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
  Pick<FilterType<ImageObject>, "categoryId" | "partition">
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
  selectedIds: string[];
  filters: AnnotationFilters;
  visible: boolean;
  sortType: AnnotationSortType;
};
export type AnnotationGridState = {
  activeKindId: string | null;
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
