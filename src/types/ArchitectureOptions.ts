import { ClassifierModelProps, SegmenterModelProps } from "./ModelType";
import { Shape } from "./Shape";

export type ClassifierArchitectureOptions = {
  selectedModel: ClassifierModelProps;
  inputShape: Shape;
};

export type SegmenterArchitectureOptions = {
  selectedModel: SegmenterModelProps;
  inputShape: Shape;
};
