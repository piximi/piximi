import type { BitDepth, Shape } from "./primatives";

export type Experiment = { id: string; name: string; channels?: number };

export type ImageSeries = {
  id: string;
  experimentId: string;
  name: string;
  bitDepth: BitDepth;
  shape: Shape;
  timeSeries: boolean;
  activeImageId: string;
};
