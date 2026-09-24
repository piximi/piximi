import type { BBox, DataArray, Shape } from "./primatives";
import type { Category } from "./category";
import type { IntensityMeasurement, ExtendedChannel } from "./channel";
import type { Partition, Predictable } from "./prediction";

export type AnnotationVolume = Omit<Predictable, "partition"> & {
  id: string;
  imageId: string;
  kindId: string;
  categoryId: string;
  timepoint?: number;
};
export type AnnotationVolumeEntities = Record<string, AnnotationVolume>;

export const OBJECT_FEATURES = [
  "area",
  "sphericity",
  "radius",
  "perimeter",
  "extent",
  "bboxArea",
  "eqpc",
  "ped",
  "compactness",
  "comX",
  "comY",
] as const;
export type ObjectFeature = (typeof OBJECT_FEATURES)[number];
export type AnnotationObject = {
  id: string;
  planeId: string;
  imageId: string;
  volumeId: string;
  partition: Partition;
  shape: Shape;
  boundingBox: BBox;
  encodedMask: Array<number>;
  decodedMask?: DataArray;
  features?: Partial<Record<ObjectFeature, number>>;
  intensityMeasurements?: Record<
    string,
    Partial<Record<IntensityMeasurement, number>>
  >;
};

export type ExtendedAnnotationObject = AnnotationObject &
  Omit<AnnotationVolume, "id" | "imageId"> & {
    /**
     * ? Include both category and categoryId for `FilterType` and `isFiltered` usage
     * ? May change if there if alternative filtering logic is implemented
     */
    category: Category;
    channelsRef: ExtendedChannel[];
    planeIdx: number;
    imageName: string;
  };
