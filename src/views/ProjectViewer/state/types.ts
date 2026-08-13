import type {
  ExtendedAnnotationObject,
  ExtendedImageObject,
} from "store/data/types";

import type { FilterType } from "utils/types";

export enum ImageSortType {
  None = "None",
  FileName = "File Name",
  Category = "Category",
  Random = "Random",
  Name = "Name",
  Softmax = "Softmax",
}
export enum AnnotationSortType {
  None = "None",
  Plane = "Plane",
  Volume = "Volume",
  Category = "Category",
  Image = "Image",
  Random = "Random",
  Softmax = "Softmax",
}

export type Comparator<T> = (a: T, b: T) => number;
export type MarginedSoftmax = Record<string, number>;
export type SortDeps = {
  margined: Record<string, number> | undefined;
  seed: number;
};

export type SortMap<T, S extends string> = {
  [K in S]: (deps: SortDeps) => Comparator<T>;
};
export type ImageFilters = Required<
  Pick<
    FilterType<Required<ExtendedImageObject>>,
    "categoryId" | "partition" | "predictionConfidence"
  >
>;
export type ImageGridState = {
  selectedIds: string[];
  filters: ImageFilters;
  sortType: ImageSortType;
};

export type AnnotationFilters = Required<
  Pick<
    FilterType<Required<ExtendedAnnotationObject>>,
    "categoryId" | "partition" | "predictionConfidence"
  >
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
  imageGridState: ImageGridState;
  annotationGridState: AnnotationGridState;
  highlightedCategory: string | undefined;
  imageChannels: number | undefined;
};
