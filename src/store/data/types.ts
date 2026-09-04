import type {
  AnnotationObject,
  AnnotationVolume,
  Category,
  Channel,
  ChannelMeta,
  Experiment,
  ImageObject,
  ImageSeries,
  Kind,
  Plane,
} from "core/entities";
import type { EntityState } from "@reduxjs/toolkit";

export * from "core/entities";

export type ItemCategoryUpdate = {
  id: string;
  categoryId: string;
  predicted?: {
    predictedAtRunId: string;
    predictionConfidence: number;
  };
};

export type DataStateV2 = {
  experiment: Experiment;
  imageSeries: EntityState<ImageSeries, string>;
  images: EntityState<ImageObject, string>;
  planes: EntityState<Plane, string>;
  kinds: EntityState<Kind, string>;
  categories: EntityState<Category, string>;
  channels: EntityState<Channel, string>;
  channelMetas: EntityState<ChannelMeta, string>;
  annotationVolumes: EntityState<AnnotationVolume, string>;
  annotations: EntityState<AnnotationObject, string>;
};
