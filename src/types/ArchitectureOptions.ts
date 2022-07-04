import { ClassifierModelProps, SegmenterModelProps } from "./ModelType";
import { Shape } from "./Shape";

export type ArchitectureOptions = {
  selectedModel: ClassifierModelProps;
  inputShape: Shape;
};

export type SegmentationArchitectureOptions = {
  selectedModel: SegmenterModelProps;
  inputShape: Shape;
};
