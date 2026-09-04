import type { Category } from "./category";
import type { ExtendedChannel } from "./channel";
import type { Predictable } from "./prediction";
import type { BitDepth, Shape } from "./primatives";

export type ImageObject = Predictable & {
  id: string;
  name: string;
  seriesId: string;
  shape: Shape;
  categoryId: string;
  activePlaneId: string;
  timepoint: number;
  bitDepth: BitDepth;
};
export type ImageEntities = Record<string, ImageObject>;

export type ExtendedImageObject = ImageObject & {
  /**
   * ? Include both category and categoryId for `FilterType` and `isFiltered` usage
   * ? May change if there if alternative filtering logic is implemented
   */
  category: Category;
  activePlaneIdx: number;
  channelsRef: ExtendedChannel[];
};
export type Plane = {
  id: string;
  imageId: string;
  zIndex: number;
};
export type PlaneEntities = Record<string, Plane>;
